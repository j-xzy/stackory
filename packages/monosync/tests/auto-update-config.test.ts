import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { autoUpdateConfig } from '../src/deps/auto-update-config.js';

function writeJson(filePath: string, value: unknown) {
	writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function registryMeta(version: string) {
	return {
		'dist-tags': { latest: version },
		time: {
			created: '2024-01-01T00:00:00.000Z',
			modified: '2024-01-01T00:00:00.000Z',
			[version]: '2024-01-01T00:00:00.000Z',
		},
	};
}

describe('autoUpdateConfig', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('updates monosync.json and de-duplicates dependency names', async () => {
		const root = await mkdtemp(path.join(tmpdir(), 'monosync-'));
		mkdirSync(root, { recursive: true });
		const configPath = path.join(root, 'monosync.json');
		writeJson(configPath, {
			dependencies: {
				foo: '1.0.0',
			},
			devDependencies: {
				foo: '1.0.0',
				locked: { version: '1.0.0', locked: true },
			},
		});
		const fetchMock = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(registryMeta('2.0.0')),
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await autoUpdateConfig(root);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			updated: [{ name: 'foo', from: '1.0.0', to: '2.0.0' }],
			failed: [],
		});
		expect(JSON.parse(readFileSync(configPath, 'utf8'))).toMatchObject({
			dependencies: { foo: '2.0.0' },
			devDependencies: {
				foo: '2.0.0',
				locked: { version: '1.0.0', locked: true },
			},
		});
	});

	it('skips workspace protocol versions when auto updating', async () => {
		const root = await mkdtemp(path.join(tmpdir(), 'monosync-'));
		const configPath = path.join(root, 'monosync.json');
		writeJson(configPath, {
			dependencies: {
				workspaceStar: 'workspace:*',
				workspaceCaret: 'workspace:^',
				workspaceObject: { version: 'workspace:^1.0.0' },
				mixed: ['workspace:*', '1.0.0'],
			},
			devDependencies: {
				workspaceTilde: 'workspace:~',
			},
		});
		const fetchMock = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(registryMeta('2.0.0')),
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await autoUpdateConfig(root);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith('https://registry.npmjs.org/mixed');
		expect(result).toEqual({
			updated: [{ name: 'mixed', from: '1.0.0', to: '2.0.0' }],
			failed: [],
		});
		expect(JSON.parse(readFileSync(configPath, 'utf8'))).toMatchObject({
			dependencies: {
				workspaceStar: 'workspace:*',
				workspaceCaret: 'workspace:^',
				workspaceObject: { version: 'workspace:^1.0.0' },
				mixed: ['workspace:*', '2.0.0'],
			},
			devDependencies: {
				workspaceTilde: 'workspace:~',
			},
		});
	});
});
