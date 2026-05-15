import type { ISignalRecord, ISignalStorage } from '../signal-record';
import type { ISignalPlugin } from './signal-plugin';

/**
 * Persister interface - handles local storage of signals
 *
 * Generic over K (signal key type) - allows project-specific typing.
 *
 * Implementations:
 * - AsyncStorage (React Native)
 * - localStorage (Web)
 * - MMKV (React Native, faster)
 */
export interface ISignalPersister<K extends string = string> {
	/**
	 * Persist a single signal record
	 * Should be called synchronously after signal update
	 */
	persist(key: K, record: ISignalRecord<K>): void;

	delete(key: K): void;

	/**
	 * Load all persisted signals
	 * Called during app initialization
	 */
	load(): Promise<ISignalStorage<K>>;

	/**
	 * Clear all persisted signals
	 * Used for logout or debug purposes
	 */
	clear(): Promise<void>;
}

/**
 * Dependencies for UserSignalsStore
 *
 * Generic over K (signal key type) - allows project-specific typing.
 * `persister` is required (hydration startup dependency).
 * All other side-effects go through plugins.
 */
export interface IUserSignalsDeps<K extends string = string> {
	/** Required - local persistence */
	persister: ISignalPersister<K>;
	/** Optional - plugins handle analytics, sync, remote, etc. */
	plugins?: ISignalPlugin<K>[];
}
