import type { ISignalDef } from '../signal-types';

/**
 * Experiment configuration
 *
 * Generic over TVariant (union of variant keys) for type-safe resolution.
 */
export interface IExperimentConfig<TVariant extends string = string> {
	/** Signal key this experiment writes to (must match registry) */
	key: string;
	/** Bump to re-assign all users to new buckets */
	version: number;
	/** Variant id → weight (percentage, should sum to 100) */
	variants: Record<TVariant, number>;
}

/**
 * Experiment resolver strategy
 *
 * Default implementation: FNV-1a hash-based deterministic resolver.
 * Swap for testing (fixed resolver) or remote assignment.
 */
export interface IExperimentResolver {
	resolve(seed: string, variants: [string, number][]): string;
}

/**
 * Signal definition with embedded experiment metadata.
 *
 * Extends `ISignalDef<'string'>` so it plugs directly into a signal registry.
 * The `__experiment` field is auto-discovered by `assignAllExperiments`.
 */
export interface IExperimentSignalDef<T extends string = string>
	extends ISignalDef<'string'> {
	/** @internal experiment metadata for auto-discovery */
	__experiment: {
		version: number;
		variants: Record<T, number>;
	};
}

/**
 * Extract variant union type from a registry entry.
 *
 * @example
 * type HomeVariant = ExperimentVariant<typeof signalRegistry, 'exp_home'>;
 * // → 'v1' | 'v2'
 */
export type ExperimentVariant<
	TRegistry extends Record<string, ISignalDef>,
	K extends keyof TRegistry,
> = TRegistry[K] extends IExperimentSignalDef<infer T> ? T : never;
