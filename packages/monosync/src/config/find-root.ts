import { existsSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_CONFIG_FILE = 'monosync.json';

export function findRoot(startDir: string): string {
	let dir = path.resolve(startDir);

	while (true) {
		if (existsSync(path.join(dir, DEFAULT_CONFIG_FILE))) {
			return dir;
		}

		const parent = path.dirname(dir);
		if (parent === dir) {
			throw new Error(
				`Could not find ${DEFAULT_CONFIG_FILE}. Use --root <dir> or --config <file> to specify the location.`,
			);
		}

		dir = parent;
	}
}
