import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { getConfigPath, loadConfig } from '../config/load-config.js';
import type {
	DependencySection,
	MonosyncError,
	PackageChange,
	PackageJson,
	SyncPackageJsonResult,
	VersionSpec,
} from '../types.js';
import { readPackages } from '../workspace/read-packages.js';
import {
	formatVersion,
	getWritableVersion,
	isLockedAtVersion,
} from './format-version.js';

function readPackageJson(filePath: string): PackageJson {
	return JSON.parse(readFileSync(filePath, 'utf8')) as PackageJson;
}

function versionSpecKey(value: VersionSpec): string {
	return JSON.stringify(formatVersion(value));
}

function checkDuplicateConfigEntries(
	configPath: string,
	dependencies: DependencySection,
	devDependencies: DependencySection,
): MonosyncError[] {
	return Object.entries(devDependencies).flatMap(([name, devValue]) => {
		const depValue = dependencies[name];
		if (!depValue || versionSpecKey(depValue) === versionSpecKey(devValue)) {
			return [];
		}

		return [
			{
				name,
				path: configPath,
				type: `config dependencies.${name} differs from devDependencies.${name}`,
			},
		];
	});
}

function syncSection({
	section,
	packageJson,
	newPackageJson,
	packageJsonPath,
	configSection,
	errors,
	changes,
}: {
	section: 'dependencies' | 'devDependencies';
	packageJson: PackageJson;
	newPackageJson: PackageJson;
	packageJsonPath: string;
	configSection: DependencySection;
	errors: MonosyncError[];
	changes: PackageChange[];
}): void {
	const currentSection = packageJson[section];
	if (!currentSection) {
		return;
	}

	const nextSection = { ...currentSection };
	newPackageJson[section] = nextSection;

	for (const [name, currentVersion] of Object.entries(currentSection)) {
		const configValue = configSection[name];
		if (!configValue) {
			errors.push({
				name,
				path: packageJsonPath,
				type: section,
			});
			continue;
		}

		if (isLockedAtVersion(configValue, currentVersion)) {
			continue;
		}

		const nextVersion = getWritableVersion(configValue);
		if (nextVersion && nextVersion !== currentVersion) {
			changes.push({
				file: packageJsonPath,
				name,
				from: currentVersion,
				to: nextVersion,
				section,
			});
			nextSection[name] = nextVersion;
		}
	}
}

export function syncPackageJson({
	write,
	rootPath,
	configPath,
}: {
	write: boolean;
	rootPath: string;
	configPath?: string;
}): SyncPackageJsonResult {
	const filePath = getConfigPath(rootPath, configPath);
	const config = loadConfig(rootPath, configPath);
	const dependencies = config.dependencies ?? {};
	const devDependencies = config.devDependencies ?? {};
	const packages = readPackages(rootPath);
	const packageJsons: Array<{ path: string; packageJson: PackageJson }> = [];
	const errors = checkDuplicateConfigEntries(
		filePath,
		dependencies,
		devDependencies,
	);
	const changes: PackageChange[] = [];

	for (const workspacePackage of Object.values(packages)) {
		const packageJsonPath = path.join(workspacePackage.path, 'package.json');
		const packageJson = readPackageJson(packageJsonPath);
		const newPackageJson = { ...packageJson };

		syncSection({
			section: 'devDependencies',
			packageJson,
			newPackageJson,
			packageJsonPath,
			configSection: devDependencies,
			errors,
			changes,
		});

		syncSection({
			section: 'dependencies',
			packageJson,
			newPackageJson,
			packageJsonPath,
			configSection: dependencies,
			errors,
			changes,
		});

		packageJsons.push({
			path: workspacePackage.path,
			packageJson: newPackageJson,
		});
	}

	if (write && errors.length === 0) {
		for (const item of packageJsons) {
			writeFileSync(
				path.join(item.path, 'package.json'),
				`${JSON.stringify(item.packageJson, null, 2)}\n`,
			);
		}
	}

	return { changes, errors };
}
