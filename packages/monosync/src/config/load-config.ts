import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { MonosyncConfig } from '../types.js';
import { DEFAULT_CONFIG_FILE } from './find-root.js';

export function getConfigPath(rootPath: string, configPath?: string): string {
	return configPath
		? path.resolve(configPath)
		: path.join(rootPath, DEFAULT_CONFIG_FILE);
}

export function loadConfig(
	rootPath: string,
	configPath?: string,
): MonosyncConfig {
	const filePath = getConfigPath(rootPath, configPath);
	const config = JSON.parse(readFileSync(filePath, 'utf8')) as MonosyncConfig;
	return {
		dependencies: {},
		devDependencies: {},
		...config,
	};
}
