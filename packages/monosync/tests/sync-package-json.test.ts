import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { syncPackageJson } from '../src/deps/sync-package-json.js';

function writeJson(filePath: string, value: unknown) {
	writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function createFixture() {
	const root = await mkdtemp(path.join(tmpdir(), 'monosync-'));
	mkdirSync(path.join(root, 'packages', 'a'), { recursive: true });
	writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
	writeJson(path.join(root, 'monosync.json'), {
		dependencies: {
			foo: '2.0.0',
			locked: { version: '1.0.0', locked: true },
		},
		devDependencies: {
			bar: '3.0.0',
		},
	});
	writeJson(path.join(root, 'package.json'), {
		name: 'root',
		devDependencies: {
			bar: '1.0.0',
		},
	});
	const packageJsonPath = path.join(root, 'packages', 'a', 'package.json');
	writeJson(packageJsonPath, {
		name: 'package-a',
		dependencies: {
			foo: '1.0.0',
			locked: '1.0.0',
		},
	});
	return { root, packageJsonPath };
}

describe('syncPackageJson', () => {
	it('reports changes without writing by default', async () => {
		const { root, packageJsonPath } = await createFixture();
		const result = syncPackageJson({ write: false, rootPath: root });

		expect(result.errors).toEqual([]);
		expect(result.changes).toEqual([
			{
				file: path.join(root, 'package.json'),
				name: 'bar',
				from: '1.0.0',
				to: '3.0.0',
				section: 'devDependencies',
			},
			{
				file: packageJsonPath,
				name: 'foo',
				from: '1.0.0',
				to: '2.0.0',
				section: 'dependencies',
			},
		]);
		expect(JSON.parse(readFileSync(packageJsonPath, 'utf8'))).toMatchObject({
			dependencies: { foo: '1.0.0' },
		});
	});

	it('writes package.json changes when requested', async () => {
		const { root, packageJsonPath } = await createFixture();
		const result = syncPackageJson({ write: true, rootPath: root });

		expect(result.errors).toEqual([]);
		expect(JSON.parse(readFileSync(packageJsonPath, 'utf8'))).toMatchObject({
			dependencies: { foo: '2.0.0', locked: '1.0.0' },
		});
	});

	it('returns errors for dependencies missing from monosync config', async () => {
		const root = await mkdtemp(path.join(tmpdir(), 'monosync-'));
		writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
		writeJson(path.join(root, 'monosync.json'), {
			dependencies: {},
			devDependencies: {},
		});
		writeJson(path.join(root, 'package.json'), {
			name: 'root',
			dependencies: { missing: '1.0.0' },
		});

		const result = syncPackageJson({ write: false, rootPath: root });
		expect(result.errors).toEqual([
			{
				name: 'missing',
				path: path.join(root, 'package.json'),
				type: 'dependencies',
			},
		]);
	});

	it('returns errors for conflicting config entries', async () => {
		const root = await mkdtemp(path.join(tmpdir(), 'monosync-'));
		writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
		writeJson(path.join(root, 'monosync.json'), {
			dependencies: { foo: '1.0.0' },
			devDependencies: { foo: '2.0.0' },
		});
		writeJson(path.join(root, 'package.json'), { name: 'root' });

		const result = syncPackageJson({ write: false, rootPath: root });
		expect(result.errors).toEqual([
			{
				name: 'foo',
				path: path.join(root, 'monosync.json'),
				type: 'config dependencies.foo differs from devDependencies.foo',
			},
		]);
	});

	it('does not flag equivalent duplicate config entries', async () => {
		const root = await mkdtemp(path.join(tmpdir(), 'monosync-'));
		writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
		writeJson(path.join(root, 'monosync.json'), {
			dependencies: { foo: '1.0.0' },
			devDependencies: { foo: { version: '1.0.0' } },
		});
		writeJson(path.join(root, 'package.json'), { name: 'root' });

		const result = syncPackageJson({ write: false, rootPath: root });
		expect(result.errors).toEqual([]);
	});
});
