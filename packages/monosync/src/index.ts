export { sync } from './commands/sync.js';
export { DEFAULT_CONFIG_FILE, findRoot } from './config/find-root.js';
export { loadConfig } from './config/load-config.js';
export { autoUpdateConfig } from './deps/auto-update-config.js';
export {
	formatVersion,
	getWritableVersion,
	isLockedAtVersion,
} from './deps/format-version.js';
export { getAgedVersion } from './deps/get-aged-version.js';
export { syncPackageJson } from './deps/sync-package-json.js';
export type {
	AutoUpdateChange,
	AutoUpdateResult,
	DependencySection,
	MonosyncConfig,
	MonosyncConfigOptions,
	MonosyncError,
	NormalizedVersionSpec,
	PackageChange,
	PackageJson,
	SyncOptions,
	SyncPackageJsonResult,
	SyncResult,
	VersionSpec,
	VersionSpecEntry,
	WorkspacePackage,
} from './types.js';
export { readPackages } from './workspace/read-packages.js';
export { resolveWorkspaceGlobs } from './workspace/resolve-workspace-globs.js';
