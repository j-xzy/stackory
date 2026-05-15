import type { IExperimentResolver } from './experiment-types';

/**
 * FNV-1a 32-bit hash
 *
 * Non-cryptographic hash with good uniform distribution for short strings.
 * Deterministic: same input always produces same output across platforms.
 */
export const fnv1a = (input: string) => {
	let hash = 2166136261; // FNV offset basis
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 16777619); // FNV prime
	}
	return hash >>> 0; // unsigned 32-bit
};

/**
 * Hash-based experiment resolver using FNV-1a
 *
 * Normalizes hash to a bucket in [0, 10000), then walks cumulative
 * weights to select the matching variant. 10000 buckets support
 * decimal percentages (e.g., 33.33%).
 */
export const hashResolver: IExperimentResolver = {
	resolve: (seed, variants) => {
		const bucket = fnv1a(seed) % 10000;

		const totalWeight = variants.reduce((sum, [, w]) => sum + w, 0);
		let cumulative = 0;

		for (const [id, weight] of variants) {
			cumulative += (weight / totalWeight) * 10000;
			if (bucket < cumulative) {
				return id;
			}
		}

		// Fallback for floating-point edge cases
		return variants[variants.length - 1][0];
	},
};
