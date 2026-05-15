import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { readPackages } from '../src/workspace/read-packages.js';

async function createWorkspace() {
	const root = await mkdtemp(path.join(tmpdir(), 'monosync-'));
	writeFileSync(
		path.join(root, 'package.json'),
		`${JSON.stringify({ name: 'root' }, null, 2)}\n`,
	);
	writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
	mkdirSync(path.join(root, 'packages', 'a'), { recursive: true });
	writeFileSync(
		path.join(root, 'packages', 'a', 'package.json'),
		`${JSON.stringify({ name: 'package-a' }, null, 2)}\n`,
	);
	return root;
}

describe('readPackages', () => {
	it('reads root and pnpm workspace packages', async () => {
		const root = await createWorkspace();
		expect(readPackages(root)).toEqual({
			root: { name: 'root', path: root },
			'package-a': {
				name: 'package-a',
				path: path.join(root, 'packages', 'a'),
			},
		});
	});
});
