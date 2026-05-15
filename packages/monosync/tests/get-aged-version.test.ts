import { afterEach, describe, expect, it, vi } from 'vitest';

import { getAgedVersion } from '../src/deps/get-aged-version.js';

const daysAgo = (days: number) =>
	new Date(Date.now() - days * 86_400_000).toISOString();

function makeMeta(latest: string, versions: Array<[string, number]>) {
	return {
		'dist-tags': { latest },
		time: {
			created: daysAgo(1000),
			modified: daysAgo(0),
			...Object.fromEntries(
				versions.map(([version, age]) => [version, daysAgo(age)]),
			),
		},
	};
}

function stubFetch(meta: unknown) {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({ json: () => Promise.resolve(meta) }),
	);
}

describe('getAgedVersion', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('returns dist-tags.latest when minAgeDays is 0', async () => {
		stubFetch(makeMeta('2.0.0', [['2.0.0', 1]]));
		expect(await getAgedVersion('pkg', 0)).toBe('2.0.0');
	});

	it('skips versions newer than the cutoff', async () => {
		stubFetch(
			makeMeta('2.0.0', [
				['2.0.0', 3],
				['1.9.0', 10],
			]),
		);
		expect(await getAgedVersion('pkg', 7)).toBe('1.9.0');
	});

	it('excludes prerelease versions', async () => {
		stubFetch(
			makeMeta('2.0.0', [
				['2.0.0-beta.1', 30],
				['1.9.0', 30],
			]),
		);
		expect(await getAgedVersion('pkg', 7)).toBe('1.9.0');
	});

	it('returns undefined when no eligible version exists', async () => {
		stubFetch(makeMeta('1.0.0', [['1.0.0', 3]]));
		expect(await getAgedVersion('pkg', 7)).toBeUndefined();
	});

	it('returns null on fetch failure', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
		expect(await getAgedVersion('pkg', 7)).toBeNull();
	});

	it('encodes scoped package names for registry requests', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(makeMeta('1.0.0', [['1.0.0', 30]])),
		});
		vi.stubGlobal('fetch', fetchMock);
		await getAgedVersion('@scope/pkg', 7, 'https://registry.example.com/');
		expect(fetchMock).toHaveBeenCalledWith(
			'https://registry.example.com/%40scope%2Fpkg',
		);
	});
});
