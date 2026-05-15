import { autoUpdateConfig } from '../deps/auto-update-config.js';
import { syncPackageJson } from '../deps/sync-package-json.js';
import type { SyncOptions, SyncResult } from '../types.js';

export async function sync(options: SyncOptions): Promise<SyncResult> {
	const autoResult = options.auto
		? await autoUpdateConfig(options.rootPath, options.configPath)
		: null;
	const checkResult = syncPackageJson({
		write: options.write,
		rootPath: options.rootPath,
		configPath: options.configPath,
	});

	return { autoResult, checkResult };
}
