import type { ISignalRecord } from '../signal-record';
import type { SignalEvent } from './signal-events';

/**
 * Plugin interface for UserSignalsStore.
 *
 * Plugins are self-contained units that react to store events.
 * They can optionally provide remote experiment assignments.
 *
 * @example
 * ```ts
 * const posthogPlugin: ISignalPlugin = {
 *   name: 'posthog',
 *   on: (event) => {
 *     if (event.type === 'experiment:exposed') {
 *       posthog.capture('$feature_flag_called', {
 *         $feature_flag: event.key,
 *         $feature_flag_response: event.variant,
 *       });
 *     }
 *   },
 * };
 * ```
 */
export interface ISignalPlugin<K extends string = string> {
	/** Unique name for debugging */
	name: string;

	/** Called synchronously for every store event */
	on(event: SignalEvent<K>): void;

	/**
	 * Optional: fetch remote experiment assignments.
	 * Called by `store.fetchRemote()`.
	 * Results are merged in plugin registration order (later overrides earlier).
	 */
	fetchExperiments?(): Promise<Partial<Record<K, ISignalRecord<K>>>>;
}
