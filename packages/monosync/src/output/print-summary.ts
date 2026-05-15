import semver from 'semver';

import type { AutoUpdateResult, SyncPackageJsonResult } from '../types.js';

export function printSummary(
	autoResult: AutoUpdateResult | null,
	checkResult: SyncPackageJsonResult,
): void {
	const sep = '-'.repeat(52);
	const lines = [`\n${sep}`, ' Monosync Summary', sep];

	if (autoResult) {
		const groups: Record<
			'major' | 'minor' | 'patch',
			typeof autoResult.updated
		> = {
			major: [],
			minor: [],
			patch: [],
		};

		for (const item of autoResult.updated) {
			const type = semver.diff(item.from, item.to) ?? 'patch';
			const group: 'major' | 'minor' | 'patch' =
				type === 'major' || type === 'minor' ? type : 'patch';
			groups[group].push(item);
		}

		for (const type of ['major', 'minor', 'patch'] as const) {
			const items = groups[type];
			if (!items.length) {
				continue;
			}

			lines.push(`\n  ${type}  (${items.length})`);
			for (const { name, from, to } of items) {
				lines.push(`    ${name.padEnd(40)} ${from} -> ${to}`);
			}
		}

		if (!autoResult.updated.length) {
			lines.push('\n  auto  (no changes)');
		}

		if (autoResult.failed.length) {
			lines.push(`\n  failed  (${autoResult.failed.length})`);
			for (const name of autoResult.failed) {
				lines.push(`    ${name}`);
			}
		}
	}

	if (checkResult.changes.length) {
		lines.push(`\n  package changes  (${checkResult.changes.length})`);
		for (const item of checkResult.changes) {
			lines.push(`    ${item.name.padEnd(40)} ${item.from} -> ${item.to}`);
		}
	}

	if (checkResult.errors.length) {
		lines.push(`\n  errors  (${checkResult.errors.length})`);
		for (const error of checkResult.errors) {
			lines.push(`    ${error.type}: ${error.name} (${error.path})`);
		}
	}

	if (
		!autoResult?.updated.length &&
		!autoResult?.failed.length &&
		!checkResult.changes.length &&
		!checkResult.errors.length
	) {
		lines.push('\n  (no changes)');
	}

	lines.push(`\n${sep}\n`);
	console.log(lines.join('\n'));
}
