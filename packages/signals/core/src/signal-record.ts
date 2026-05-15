/**
 * Signal source - determines priority when reading
 * remote > local (allows server-side overrides for A/B tests, feature flags)
 */
export type SignalSource = 'local' | 'remote';

/**
 * A single signal record with metadata
 *
 * Generic over K (signal key type) - allows project-specific typing.
 */
export interface ISignalRecord<K extends string = string, V = unknown> {
	/** The signal key */
	key: K;
	/** The signal value */
	value: V;
	/** When this signal was last updated (unix ms) */
	updatedAt: number;
	/** Additional context about the signal (e.g., where it was set) */
	metadata?: Record<string, unknown>;
	/** Where this value came from */
	source: SignalSource;
	/** When this signal was last synced to remote (unix ms) */
	syncedAt?: number;
}

/**
 * Serialized storage format for persistence
 *
 * Generic over K (signal key type) - allows project-specific typing.
 */
export interface ISignalStorage<K extends string = string> {
	/** Schema version for migrations */
	version: number;
	/** All signal records keyed by signal key */
	signals: Partial<Record<K, ISignalRecord<K>>>;
}

/**
 * Create an empty signal storage object
 */
export const createEmptySignalStorage = <K extends string = string>(
	version: number,
): ISignalStorage<K> => ({
	version,
	signals: {},
});
