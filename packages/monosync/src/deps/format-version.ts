import type { NormalizedVersionSpec, VersionSpec } from '../types.js';

export function formatVersion(value: VersionSpec): NormalizedVersionSpec[] {
	if (!value) {
		throw new Error(`Invalid version value: ${String(value)}`);
	}

	if (typeof value === 'string') {
		return [{ version: value, locked: false }];
	}

	if (Array.isArray(value)) {
		return value.flatMap((item) => formatVersion(item));
	}

	if (!value.version) {
		throw new Error(`Invalid version value: ${JSON.stringify(value)}`);
	}

	return [{ version: value.version, locked: value.locked ?? false }];
}

export function getWritableVersion(value: VersionSpec): string | null {
	const versions = formatVersion(value);
	const unlocked = versions.find(
		(item) => !item.locked && !isWorkspaceVersion(item.version),
	);
	return unlocked?.version ?? null;
}

export function isLockedAtVersion(
	value: VersionSpec,
	version: string,
): boolean {
	return formatVersion(value).some(
		(item) => item.locked && item.version === version,
	);
}

export function isWorkspaceVersion(version: string): boolean {
	return version.startsWith('workspace:');
}

export function shouldAutoUpdate(value: VersionSpec): boolean {
	return getWritableVersion(value) !== null;
}
