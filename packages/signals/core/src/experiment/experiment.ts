import type { ISignalDef, SignalTypeMap } from '../signal-types';
import type { UserSignalsStore } from '../user-signals.store';
import type {
	IExperimentConfig,
	IExperimentResolver,
	IExperimentSignalDef,
} from './experiment-types';
import { hashResolver } from './hash-resolver';

/**
 * Define a signal that is also an experiment.
 *
 * Combines `defineSignal({ type: 'string', disableSync: true })` with
 * experiment metadata in a single declaration. The `__experiment` field
 * is auto-discovered by `assignAllExperiments`.
 *
 * @example
 * const signalRegistry = {
 *   exp_home: defineExperimentSignal({ v1: 50, v2: 50 }),
 *   exp_welcome: defineExperimentSignal(
 *     { original: 70, redesign: 30 },
 *     { version: 2, description: 'Welcome redesign' },
 *   ),
 * } as const;
 */
export const defineExperimentSignal = <T extends string>(
	variants: Record<T, number>,
	options?: { version?: number; description?: string },
): IExperimentSignalDef<T> => ({
	type: 'string',
	disableSync: true,
	description: options?.description,
	__experiment: {
		version: options?.version ?? 1,
		variants,
	},
});

/**
 * Resolve experiment variant (pure, stateless).
 *
 * Seed is constructed as `${clientId}:${key}:${version}` for deterministic,
 * version-aware bucketing.
 */
const resolveExperiment = <T extends string>(
	seed: string,
	experiment: IExperimentConfig<T>,
	resolver: IExperimentResolver = hashResolver,
): T => {
	const fullSeed = `${seed}:${experiment.key}:${experiment.version}`;
	const entries = Object.entries<number>(experiment.variants) as [T, number][];
	return resolver.resolve(fullSeed, entries) as T;
};

/**
 * Assign a single experiment variant with sticky semantics.
 *
 * - Already assigned with same version → returns cached value, zero side effects
 * - New or version bumped → resolves via hash + writes to store
 */
export const assignExperiment = <
	TRegistry extends Record<string, ISignalDef>,
	T extends string,
>(params: {
	store: UserSignalsStore<TRegistry>;
	seed: string;
	experiment: IExperimentConfig<T>;
	resolver?: IExperimentResolver;
}): T => {
	const { store, seed, experiment, resolver = hashResolver } = params;
	type K = keyof TRegistry & string;
	const signalKey = experiment.key as K;

	// Sticky: same version → return cached assignment
	const existing = store.getRecord(signalKey);
	if (existing?.metadata?.experimentVersion === experiment.version) {
		return existing.value as T;
	}

	// Resolve + write
	const variant = resolveExperiment(seed, experiment, resolver);
	store.set(
		signalKey,
		variant as unknown as SignalTypeMap[TRegistry[K]['type']],
		{
			experimentKey: experiment.key,
			experimentVersion: experiment.version,
			assignedAt: Date.now(),
		},
	);

	return variant;
};

/**
 * Auto-discover and assign all experiments in a registry.
 *
 * Scans the registry for entries created with `defineExperimentSignal`,
 * then calls `assignExperiment` for each. Adding a new experiment to
 * the registry is all that's needed — no initializer changes required.
 *
 * @example
 * assignAllExperiments({ store: signalsStore, registry: signalRegistry, seed: clientId });
 */
export const assignAllExperiments = <
	TRegistry extends Record<string, ISignalDef>,
>(params: {
	store: UserSignalsStore<TRegistry>;
	registry: TRegistry;
	seed: string;
	resolver?: IExperimentResolver;
}) => {
	const { store, registry, seed, resolver = hashResolver } = params;
	for (const [key, def] of Object.entries(registry)) {
		if ('__experiment' in def) {
			const { version, variants } = (def as IExperimentSignalDef).__experiment;
			assignExperiment({
				store,
				seed,
				experiment: { key, version, variants },
				resolver,
			});
		}
	}
};
