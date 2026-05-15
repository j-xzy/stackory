import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

import type { PackageJson } from '../types.js';

export function resolveWorkspaceGlobs(rootPath: string): string[] {
	const pnpmWorkspace = path.join(rootPath, 'pnpm-workspace.yaml');
	if (existsSync(pnpmWorkspace)) {
		const workspace = YAML.parse(readFileSync(pnpmWorkspace, 'utf8')) as {
			packages?: string[];
		} | null;
		return workspace?.packages ?? [];
	}

	const pkgJsonPath = path.join(rootPath, 'package.json');
	if (existsSync(pkgJsonPath)) {
		const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as PackageJson;
		if (pkg.workspaces) {
			return Array.isArray(pkg.workspaces)
				? pkg.workspaces
				: (pkg.workspaces.packages ?? []);
		}
	}

	return [];
}
