import { existsSync, globSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { PackageJson, WorkspacePackage } from '../types.js';
import { resolveWorkspaceGlobs } from './resolve-workspace-globs.js';

function readPackageJson(filePath: string): PackageJson {
	return JSON.parse(readFileSync(filePath, 'utf8')) as PackageJson;
}

export function readPackages(
	rootPath: string,
): Record<string, WorkspacePackage> {
	const packages: Record<string, WorkspacePackage> = {};
	const rootPkgPath = path.join(rootPath, 'package.json');

	if (existsSync(rootPkgPath)) {
		const rootPkg = readPackageJson(rootPkgPath);
		if (rootPkg.name) {
			packages[rootPkg.name] = { name: rootPkg.name, path: rootPath };
		}
	}

	for (const pattern of resolveWorkspaceGlobs(rootPath)) {
		const matches = globSync(pattern, { cwd: rootPath });
		for (const pkgDir of matches) {
			const packagePath = path.join(rootPath, pkgDir, 'package.json');
			if (!existsSync(packagePath)) {
				continue;
			}

			const pkg = readPackageJson(packagePath);
			if (pkg.name) {
				packages[pkg.name] = {
					name: pkg.name,
					path: path.join(rootPath, pkgDir),
				};
			}
		}
	}

	return packages;
}
