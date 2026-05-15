export type VersionSpec =
	| string
	| VersionSpecEntry
	| Array<string | VersionSpecEntry>;

export type DependencySection = Record<string, VersionSpec>;

export type VersionSpecEntry = {
	version: string;
	locked?: boolean;
};

export type NormalizedVersionSpec = {
	version: string;
	locked: boolean;
};

export type MonosyncConfigOptions = {
	registry?: string;
	minAgeDays?: number;
	retries?: number;
	allowDowngrade?: boolean;
};

export type MonosyncConfig = {
	config?: MonosyncConfigOptions;
	dependencies?: DependencySection;
	devDependencies?: DependencySection;
};

export type PackageJson = {
	name?: string;
	workspaces?: string[] | { packages?: string[] };
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	[key: string]: unknown;
};

export type WorkspacePackage = {
	name: string;
	path: string;
};

export type PackageChange = {
	file: string;
	name: string;
	from: string;
	to: string;
	section: 'dependencies' | 'devDependencies';
};

export type MonosyncError = {
	name: string;
	path: string;
	type: string;
};

export type AutoUpdateChange = {
	name: string;
	from: string;
	to: string;
};

export type AutoUpdateResult = {
	updated: AutoUpdateChange[];
	failed: string[];
};

export type SyncPackageJsonResult = {
	changes: PackageChange[];
	errors: MonosyncError[];
};

export type SyncOptions = {
	write: boolean;
	auto: boolean;
	rootPath: string;
	configPath?: string;
};

export type SyncResult = {
	autoResult: AutoUpdateResult | null;
	checkResult: SyncPackageJsonResult;
};
