/**
 * Signal Types - Generic type definitions for user signals
 *
 * This file contains platform-agnostic type definitions.
 * Business-specific signal registries should be defined in each project.
 *
 * @example
 * ```ts
 * // In your project's signal-registry.ts:
 * import type { ISignalDef, SignalTypeMap } from '@ootd/shared/signals';
 *
 * export const signalRegistry = {
 *   onboarding_completed: { type: 'boolean' },
 *   clothes_count: { type: 'number' },
 * } as const satisfies Record<string, ISignalDef>;
 *
 * export type SignalKey = keyof typeof signalRegistry;
 * export type SignalValueType<K extends SignalKey> =
 *   SignalTypeMap[(typeof signalRegistry)[K]['type']];
 * ```
 */

/**
 * Supported signal value types
 */
export type SignalType = 'boolean' | 'number' | 'string' | 'timestamp';

/**
 * Maps signal type names to their TypeScript types
 */
export type SignalTypeMap = {
	boolean: boolean;
	number: number;
	string: string;
	timestamp: number; // unix ms
};

/**
 * Definition for a single signal in the registry
 */
export interface ISignalDef<T extends SignalType = SignalType> {
	type: T;
	description?: string;
	defaultValue?: SignalTypeMap[T];
	/** Disable analytics tracking for this signal */
	disableTrack?: boolean;
	/** Disable remote sync for this signal */
	disableSync?: boolean;
}

/**
 * Helper type to extract value type from a registry
 *
 * @example
 * type MyValue = InferSignalValue<typeof myRegistry, 'my_key'>;
 */
export type InferSignalValue<
	TRegistry extends Record<string, ISignalDef>,
	K extends keyof TRegistry,
> = SignalTypeMap[TRegistry[K]['type']];

export function defineSignal<T extends SignalType>(
	def: ISignalDef<T>,
): ISignalDef<T> {
	return def;
}
