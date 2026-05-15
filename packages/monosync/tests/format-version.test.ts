import { describe, expect, it } from 'vitest';

import {
	formatVersion,
	getWritableVersion,
	isLockedAtVersion,
	isWorkspaceVersion,
	shouldAutoUpdate,
} from '../src/deps/format-version.js';

describe('formatVersion', () => {
	it('converts a string to an unlocked version entry', () => {
		expect(formatVersion('1.0.0')).toEqual([
			{ version: '1.0.0', locked: false },
		]);
	});

	it('handles mixed arrays', () => {
		expect(formatVersion(['1.0.0', { version: '2.0.0', locked: true }])).toEqual(
			[
				{ version: '1.0.0', locked: false },
				{ version: '2.0.0', locked: true },
			],
		);
	});

	it('defaults object entries to unlocked', () => {
		expect(formatVersion({ version: '1.0.0' })).toEqual([
			{ version: '1.0.0', locked: false },
		]);
	});

	it('throws on invalid values', () => {
		expect(() => formatVersion('')).toThrow('Invalid version value');
		expect(() => formatVersion({ locked: true } as never)).toThrow(
			'Invalid version value',
		);
	});
});

describe('version helpers', () => {
	it('returns the first writable version', () => {
		expect(
			getWritableVersion([
				{ version: '1.0.0', locked: true },
				{ version: '2.0.0' },
			]),
		).toBe('2.0.0');
	});

	it('detects locked versions', () => {
		expect(isLockedAtVersion({ version: '1.0.0', locked: true }, '1.0.0')).toBe(
			true,
		);
		expect(isLockedAtVersion({ version: '1.0.0' }, '1.0.0')).toBe(false);
	});

	it('detects workspace protocol versions', () => {
		expect(isWorkspaceVersion('workspace:*')).toBe(true);
		expect(isWorkspaceVersion('workspace:^')).toBe(true);
		expect(isWorkspaceVersion('workspace:^1.0.0')).toBe(true);
		expect(isWorkspaceVersion('1.0.0')).toBe(false);
	});

	it('skips workspace protocol versions for auto update', () => {
		expect(shouldAutoUpdate('workspace:*')).toBe(false);
		expect(shouldAutoUpdate({ version: 'workspace:^' })).toBe(false);
		expect(
			shouldAutoUpdate(['workspace:*', { version: '1.0.0', locked: true }]),
		).toBe(false);
		expect(shouldAutoUpdate(['workspace:*', '1.0.0'])).toBe(true);
	});
});
