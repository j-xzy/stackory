import type { IUserSignalsDeps } from './interfaces/signal-adapters';
import type { SignalEvent } from './interfaces/signal-events';
import type { ISignalRecord } from './signal-record';
import type { ISignalDef, SignalTypeMap } from './signal-types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Infer the value type for a specific key from the registry
 */
type InferValue<
	TRegistry extends Record<string, ISignalDef>,
	K extends keyof TRegistry,
> = SignalTypeMap[TRegistry[K]['type']];

/**
 * UserSignalsStore - Central store for user behavioral signals
 *
 * Generic over TRegistry (the signal registry type) - allows full type inference
 * for both keys and values based on the registry definition.
 *
 * Key design principles:
 * 1. Type-safe: Signal keys AND values are validated at compile time
 * 2. Plugin-based side-effects: Every write emits typed events to plugins
 * 3. Remote override: Remote values take priority over local (for A/B tests)
 * 4. Multi-type values: Supports boolean, number, string, timestamp
 * 5. Framework-agnostic: No UI library dependency; reactivity via subscribe()
 *
 * Reactivity adapters (MobX, useSyncExternalStore, etc.) subscribe to
 * change notifications and own their own observable layer.
 *
 * @example
 * ```ts
 * const store = new UserSignalsStore(registry, {
 *   persister,
 *   plugins: [posthogPlugin, mixpanelPlugin],
 * });
 * ```
 */
export class UserSignalsStore<
	TRegistry extends Record<string, ISignalDef> = Record<string, ISignalDef>,
> {
	signals = new Map<
		keyof TRegistry & string,
		ISignalRecord<keyof TRegistry & string>
	>();

	isHydrated = false;

	private readonly registry: TRegistry;
	private readonly deps: IUserSignalsDeps<keyof TRegistry & string>;
	private readonly listeners = new Set<() => void>();

	constructor(
		registry: TRegistry,
		deps: IUserSignalsDeps<keyof TRegistry & string>,
	) {
		this.registry = registry;
		this.deps = deps;
	}

	/**
	 * Subscribe to any state change (signals or isHydrated).
	 * Returns an unsubscribe function.
	 *
	 * Designed for use with useSyncExternalStore or reactive adapters.
	 */
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	private notify = () => {
		for (const listener of this.listeners) {
			listener();
		}
	};

	/**
	 * Emit an event to all registered plugins.
	 * Synchronous — plugins handle their own async work.
	 * Errors in one plugin do not affect others.
	 */
	private emit = (event: SignalEvent<keyof TRegistry & string>) => {
		const { plugins } = this.deps;
		if (!plugins) {
			return;
		}
		for (const plugin of plugins) {
			try {
				plugin.on(event);
			} catch (_error) {
				// Plugin errors are isolated — do not break store or other plugins
			}
		}
	};

	/**
	 * Set a signal value (local write)
	 *
	 * Triggers:
	 * 1. Update state
	 * 2. Persist to local storage
	 * 3. Emit `signal:set` event to plugins
	 * 4. Auto-emit `experiment:assigned` if experiment metadata is present
	 * 5. Notify subscribers
	 */
	set = <K extends keyof TRegistry & string>(
		key: K,
		value: InferValue<TRegistry, K>,
		metadata?: Record<string, unknown>,
	) => {
		const def = this.registry[key];
		const record: ISignalRecord<keyof TRegistry & string> = {
			key,
			value,
			updatedAt: Date.now(),
			metadata,
			source: 'local',
		};

		this.signals.set(key, record);
		this.deps.persister.persist(key, record);

		this.emit({
			type: 'signal:set',
			key,
			value,
			source: 'local',
			metadata,
			def,
		});

		// Auto-detect experiment assignment via metadata convention
		if (
			metadata?.experimentKey &&
			typeof metadata.experimentVersion === 'number'
		) {
			this.emit({
				type: 'experiment:assigned',
				key,
				variant: String(value),
				version: metadata.experimentVersion as number,
				source: 'local',
			});
		}

		this.notify();
	};

	/**
	 * Set a signal from remote source (server override)
	 *
	 * Remote values take priority over local values.
	 * Used for A/B tests, feature flags, growth campaigns.
	 */
	setFromRemote = <K extends keyof TRegistry & string>(
		key: K,
		value: InferValue<TRegistry, K>,
		metadata?: Record<string, unknown>,
	) => {
		const def = this.registry[key];
		const record: ISignalRecord<keyof TRegistry & string> = {
			key,
			value,
			updatedAt: Date.now(),
			source: 'remote',
			syncedAt: Date.now(),
			metadata,
		};

		this.signals.set(key, record);
		this.deps.persister.persist(key, record);

		this.emit({
			type: 'signal:set',
			key,
			value,
			source: 'remote',
			metadata,
			def,
		});

		if (
			metadata?.experimentKey &&
			typeof metadata.experimentVersion === 'number'
		) {
			this.emit({
				type: 'experiment:assigned',
				key,
				variant: String(value),
				version: metadata.experimentVersion as number,
				source: 'remote',
			});
		}

		this.notify();
	};

	/**
	 * Clear a signal (remove from store)
	 */
	clear = (key: keyof TRegistry & string) => {
		const record = this.signals.get(key);
		if (record) {
			this.signals.delete(key);
			this.deps.persister.delete(key);

			this.emit({
				type: 'signal:cleared',
				key,
				previousValue: record.value,
			});

			this.notify();
		}
	};

	/**
	 * Track that an experiment variant was exposed to the user.
	 *
	 * Call this when the user actually sees the experiment variant
	 * (e.g., component render), NOT at assignment time.
	 *
	 * No-op if the signal has no experiment metadata.
	 */
	trackExposure = (key: keyof TRegistry & string) => {
		const record = this.signals.get(key);
		if (
			!record?.metadata?.experimentKey ||
			typeof record.metadata.experimentVersion !== 'number'
		) {
			return;
		}

		this.emit({
			type: 'experiment:exposed',
			key,
			variant: String(record.value),
			version: record.metadata.experimentVersion as number,
		});
	};

	/**
	 * Get a signal value
	 *
	 * Returns the default value from registry if signal doesn't exist,
	 * or undefined if no default is defined.
	 * For boolean checks, prefer `isTrue()` which defaults to false.
	 */
	get = <K extends keyof TRegistry & string>(
		key: K,
	): InferValue<TRegistry, K> | undefined => {
		const record = this.signals.get(key);
		if (record) {
			return record.value as InferValue<TRegistry, K>;
		}
		const def = this.registry[key];
		return def?.defaultValue as InferValue<TRegistry, K> | undefined;
	};

	/**
	 * Get the full signal record (includes metadata, timestamps)
	 */
	getRecord = <K extends keyof TRegistry & string>(
		key: K,
	): ISignalRecord<keyof TRegistry & string> | undefined => {
		return this.signals.get(key);
	};

	/**
	 * Check if a boolean signal is true
	 *
	 * Returns false if signal doesn't exist or is not true.
	 * Safer than `get()` for conditional checks.
	 */
	isTrue = (key: keyof TRegistry & string): boolean => {
		const value = this.get(key);
		return value === true;
	};

	/**
	 * Check if a timestamp signal is within N days from now
	 */
	isWithinDays = (key: keyof TRegistry & string, days: number): boolean => {
		const record = this.getRecord(key);
		if (!record || typeof record.value !== 'number') {
			return false;
		}
		return Date.now() - record.value < days * MS_PER_DAY;
	};

	/**
	 * Check if a counter signal is at least N
	 */
	isAtLeast = (key: keyof TRegistry & string, threshold: number): boolean => {
		const value = this.get(key);
		return typeof value === 'number' && value >= threshold;
	};

	/**
	 * Increment a numeric signal
	 */
	increment = <K extends keyof TRegistry & string>(
		key: K,
		metadata?: Record<string, unknown>,
	) => {
		const current = this.get(key);
		const newValue = (typeof current === 'number' ? current : 0) + 1;
		this.set(key, newValue as InferValue<TRegistry, K>, metadata);
	};

	/**
	 * Set timestamp to current time
	 */
	setTimestamp = <K extends keyof TRegistry & string>(
		key: K,
		metadata?: Record<string, unknown>,
	) => {
		this.set(key, Date.now() as InferValue<TRegistry, K>, metadata);
	};

	/**
	 * Hydrate store from persisted storage
	 *
	 * Called during app initialization. Should only be called once.
	 */
	hydrate = async () => {
		if (this.isHydrated) {
			return;
		}

		const storage = await this.deps.persister.load();

		for (const [key, record] of Object.entries(storage.signals)) {
			if (record) {
				this.signals.set(
					key as keyof TRegistry & string,
					record as ISignalRecord<keyof TRegistry & string>,
				);
			}
		}

		this.isHydrated = true;
		this.emit({ type: 'signal:hydrated' });
		this.notify();
	};

	/**
	 * Fetch and apply remote experiment assignments from plugins.
	 *
	 * Iterates plugins in registration order. Later plugins override earlier.
	 */
	fetchRemote = async () => {
		const { plugins } = this.deps;
		if (!plugins) {
			return;
		}

		for (const plugin of plugins) {
			if (!plugin.fetchExperiments) {
				continue;
			}

			try {
				const remoteSignals = await plugin.fetchExperiments();

				for (const [key, record] of Object.entries(remoteSignals)) {
					if (record) {
						this.signals.set(
							key as keyof TRegistry & string,
							record as ISignalRecord<keyof TRegistry & string>,
						);
						this.deps.persister.persist(
							key as keyof TRegistry & string,
							record as ISignalRecord<keyof TRegistry & string>,
						);
					}
				}
			} catch (_error) {
				// Plugin errors are isolated
			}
		}

		this.notify();
	};

	/**
	 * Reset all signals (for logout or debug)
	 */
	reset = async () => {
		this.signals.clear();
		this.isHydrated = false;
		await this.deps.persister.clear();
		this.notify();
	};
}
