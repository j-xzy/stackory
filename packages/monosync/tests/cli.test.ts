import { describe, expect, it } from 'vitest';

import { parseArgs } from '../src/cli.js';

describe('parseArgs', () => {
	it('parses supported options', () => {
		expect(
			parseArgs(['--write', '--auto', '--root', '.', '--config', 'monosync.json']),
		).toEqual({
			write: true,
			auto: true,
			root: '.',
			config: 'monosync.json',
			help: false,
			version: false,
		});
	});

	it('parses help and version aliases', () => {
		expect(parseArgs(['-h']).help).toBe(true);
		expect(parseArgs(['-v']).version).toBe(true);
	});

	it('rejects unknown options', () => {
		expect(() => parseArgs(['--json'])).toThrow('Unknown option');
	});

	it('rejects positional arguments', () => {
		expect(() => parseArgs(['deps'])).toThrow('Unexpected argument');
	});

	it('requires option values', () => {
		expect(() => parseArgs(['--config'])).toThrow('Missing value');
	});
});
