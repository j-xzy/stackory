import { readFileSync, writeFileSync } from 'node:fs';
import semver from 'semver';

import { getConfigPath } from '../config/load-config.js';
import type {
	AutoUpdateResult,
	DependencySection,
	MonosyncConfig,
} from '../types.js';
import {
	getWritableVersion,
	isWorkspaceVersion,
	shouldAutoUpdate,
} from './format-version.js';
import { getAgedVersion } from './get-aged-version.js';

function listDependencyNames(
	dependencies: DependencySection,
	devDependencies: DependencySection,
): string[] {
	return Array.from(
		new Set(
			[...Object.entries(dependencies), ...Object.entries(devDependencies)]
				.filter(([, value]) => shouldAutoUpdate(value))
				.map(([name]) => name),
		),
	);
}

function updateDependency(
	dependencies: DependencySection,
	name: string,
	version: string,
): void {
	const current = dependencies[name];
	if (!current) {
		return;
	}

	if (typeof current === 'string') {
		if (isWorkspaceVersion(current)) {
			return;
		}
		dependencies[name] = version;
		return;
	}

	if (Array.isArray(current)) {
		dependencies[name] = current.map((item) => {
			if (typeof item === 'string') {
				if (isWorkspaceVersion(item)) {
					return item;
				}
				return version;
			}
			if (item.locked || isWorkspaceVersion(item.version)) {
				return item;
			}
			return { ...item, version };
		});
		return;
	}

	if (!current.locked) {
		dependencies[name] = { ...current, version };
	}
}

function getExistingVersion(
	config: MonosyncConfig,
	name: string,
): string | null {
	const value = config.dependencies?.[name] ?? config.devDependencies?.[name];
	return value ? getWritableVersion(value) : null;
}

export async function autoUpdateConfig(
	rootPath: string,
	configPath?: string,
): Promise<AutoUpdateResult> {
	const filePath = getConfigPath(rootPath, configPath);
	const config = JSON.parse(readFileSync(filePath, 'utf8')) as MonosyncConfig;
	const dependencies = config.dependencies ?? {};
	const devDependencies = config.devDependencies ?? {};
	const packageNames = listDependencyNames(dependencies, devDependencies);
	const options = config.config ?? {};
	const minAgeDays = options.minAgeDays ?? 0;
	const maxRetries = options.retries ?? 2;
	const registry = options.registry ?? 'https://registry.npmjs.org';
	const allowDowngrade = options.allowDowngrade ?? false;
	const oldVersions = Object.fromEntries(
		packageNames.map((name) => [name, getExistingVersion(config, name)]),
	) as Record<string, string | null>;

	const versions = new Array<string | null | undefined>(
		packageNames.length,
	).fill(null);
	let pending = packageNames.map((_, index) => index);

	for (
		let attempt = 0;
		attempt <= maxRetries && pending.length > 0;
		attempt += 1
	) {
		const fetched = await Promise.all(
			pending.map((index) =>
				getAgedVersion(packageNames[index], minAgeDays, registry),
			),
		);
		const nextPending: number[] = [];

		fetched.forEach((version, fetchedIndex) => {
			const packageIndex = pending[fetchedIndex];
			if (version !== null) {
				versions[packageIndex] = version;
			} else {
				nextPending.push(packageIndex);
			}
		});

		if (nextPending.length > 0 && attempt < maxRetries) {
			console.warn(
				`Retrying ${nextPending.length} failed package(s) (attempt ${attempt + 1}/${maxRetries})...`,
			);
		}

		pending = nextPending;
	}

	const updated = packageNames.flatMap((name, index) => {
		const version = versions[index];
		const from = oldVersions[name];

		if (
			!version ||
			(!allowDowngrade &&
				from &&
				semver.valid(from) &&
				!semver.gt(version, from))
		) {
			return [];
		}

		updateDependency(dependencies, name, version);
		updateDependency(devDependencies, name, version);
		return from && from !== version ? [{ name, from, to: version }] : [];
	});

	writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`);

	return {
		updated,
		failed: pending.map((index) => packageNames[index]),
	};
}
