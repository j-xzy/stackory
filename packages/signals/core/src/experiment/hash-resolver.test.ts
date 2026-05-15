import { describe, expect, it } from 'vitest';
import { fnv1a, hashResolver } from './hash-resolver';

describe('fnv1a', () => {
	it('returns consistent hash for the same input', () => {
		const hash = fnv1a('hello');
		expect(fnv1a('hello')).toBe(hash);
	});

	it('returns different hashes for different inputs', () => {
		expect(fnv1a('hello')).not.toBe(fnv1a('world'));
	});

	it('returns unsigned 32-bit integer', () => {
		const hash = fnv1a('test');
		expect(hash).toBeGreaterThanOrEqual(0);
		expect(hash).toBeLessThanOrEqual(0xffffffff);
	});

	it('handles empty string', () => {
		const hash = fnv1a('');
		expect(hash).toBe(2166136261); // offset basis unchanged
	});
});

describe('hashResolver', () => {
	const variants: [string, number][] = [
		['v1', 50],
		['v2', 50],
	];

	it('returns deterministic variant for the same seed', () => {
		const a = hashResolver.resolve('seed-abc', variants);
		const b = hashResolver.resolve('seed-abc', variants);
		expect(a).toBe(b);
	});

	it('returns one of the defined variant ids', () => {
		const result = hashResolver.resolve('any-seed', variants);
		expect(['v1', 'v2']).toContain(result);
	});

	it('distributes roughly evenly across 50/50 variants', () => {
		const counts: Record<string, number> = { v1: 0, v2: 0 };
		const total = 10000;

		for (let i = 0; i < total; i++) {
			const variant = hashResolver.resolve(`client-${i}`, variants);
			counts[variant]++;
		}

		// Allow 5% tolerance
		expect(counts.v1).toBeGreaterThan(total * 0.45);
		expect(counts.v1).toBeLessThan(total * 0.55);
		expect(counts.v2).toBeGreaterThan(total * 0.45);
		expect(counts.v2).toBeLessThan(total * 0.55);
	});

	it('respects unequal weights', () => {
		const weighted: [string, number][] = [
			['heavy', 90],
			['light', 10],
		];
		const counts: Record<string, number> = { heavy: 0, light: 0 };
		const total = 10000;

		for (let i = 0; i < total; i++) {
			const variant = hashResolver.resolve(`user-${i}`, weighted);
			counts[variant]++;
		}

		// heavy should get ~90%, allow 5% tolerance
		expect(counts.heavy).toBeGreaterThan(total * 0.85);
		expect(counts.light).toBeLessThan(total * 0.15);
	});

	it('handles three-way split', () => {
		const threeWay: [string, number][] = [
			['a', 33],
			['b', 33],
			['c', 34],
		];
		const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
		const total = 10000;

		for (let i = 0; i < total; i++) {
			const variant = hashResolver.resolve(`id-${i}`, threeWay);
			counts[variant]++;
		}

		// Each ~33%, allow 5% tolerance
		for (const key of ['a', 'b', 'c']) {
			expect(counts[key]).toBeGreaterThan(total * 0.28);
			expect(counts[key]).toBeLessThan(total * 0.38);
		}
	});

	it('normalizes weights that do not sum to 100', () => {
		const unnormalized: [string, number][] = [
			['x', 1],
			['y', 3],
		];
		const counts: Record<string, number> = { x: 0, y: 0 };
		const total = 10000;

		for (let i = 0; i < total; i++) {
			const variant = hashResolver.resolve(`n-${i}`, unnormalized);
			counts[variant]++;
		}

		// x ~25%, y ~75%
		expect(counts.x).toBeGreaterThan(total * 0.2);
		expect(counts.x).toBeLessThan(total * 0.3);
		expect(counts.y).toBeGreaterThan(total * 0.7);
		expect(counts.y).toBeLessThan(total * 0.8);
	});

	it('returns the single variant when only one exists', () => {
		const single: [string, number][] = [['only', 100]];
		expect(hashResolver.resolve('any', single)).toBe('only');
	});
});
