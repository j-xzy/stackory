import { describe, expect, it } from 'vitest';
import type { ISignalPersister } from '../interfaces/signal-adapters';
import type { ISignalRecord } from '../signal-record';
import type { ISignalDef } from '../signal-types';
import { defineSignal } from '../signal-types';
import { UserSignalsStore } from '../user-signals.store';
import {
	assignAllExperiments,
	assignExperiment,
	defineExperimentSignal,
} from './experiment';
import type { IExperimentResolver } from './experiment-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fixed resolver that always returns the Nth variant */
const fixedResolver = (variantIndex = 0): IExperimentResolver => ({
	resolve: (_seed, variants) => variants[variantIndex][0],
});

/** Minimal in-memory persister for testing */
const memoryPersister = <K extends string>(): ISignalPersister<K> => {
	const storage = {} as Record<K, ISignalRecord<K>>;
	return {
		persist: (key, record) => {
			storage[key] = record;
		},
		load: async () => ({ version: 1, signals: storage }),
		delete: (key) => {
			delete storage[key];
		},
		clear: async () => {
			for (const k of Object.keys(storage)) {
				delete storage[k as K];
			}
		},
	};
};

const createStore = <T extends Record<string, ISignalDef>>(registry: T) =>
	new UserSignalsStore(registry, {
		persister: memoryPersister<keyof T & string>(),
	});

// ---------------------------------------------------------------------------
// defineExperimentSignal
// ---------------------------------------------------------------------------

describe('defineExperimentSignal', () => {
	it('produces a signal def with type string and disableSync', () => {
		const def = defineExperimentSignal({ v1: 50, v2: 50 });
		expect(def.type).toBe('string');
		expect(def.disableSync).toBe(true);
	});

	it('embeds __experiment metadata with default version 1', () => {
		const def = defineExperimentSignal({ a: 30, b: 70 });
		expect(def.__experiment.version).toBe(1);
		expect(def.__experiment.variants).toEqual({ a: 30, b: 70 });
	});

	it('accepts custom version and description', () => {
		const def = defineExperimentSignal(
			{ x: 50, y: 50 },
			{ version: 3, description: 'test' },
		);
		expect(def.__experiment.version).toBe(3);
		expect(def.description).toBe('test');
	});
});

// ---------------------------------------------------------------------------
// assignExperiment
// ---------------------------------------------------------------------------

describe('assignExperiment', () => {
	const registry = {
		exp_test: defineExperimentSignal({ v1: 50, v2: 50 }),
	} as const;

	it('assigns a variant and writes to store', () => {
		const store = createStore(registry);
		const variant = assignExperiment({
			store,
			seed: 'seed',
			experiment: { key: 'exp_test', version: 1, variants: { v1: 50, v2: 50 } },
			resolver: fixedResolver(0),
		});

		expect(variant).toBe('v1');
		expect(store.get('exp_test')).toBe('v1');
	});

	it('writes experiment metadata to record', () => {
		const store = createStore(registry);
		assignExperiment({
			store,
			seed: 'seed',
			experiment: { key: 'exp_test', version: 1, variants: { v1: 50, v2: 50 } },
			resolver: fixedResolver(0),
		});

		const record = store.getRecord('exp_test');
		expect(record?.metadata?.experimentKey).toBe('exp_test');
		expect(record?.metadata?.experimentVersion).toBe(1);
		expect(record?.metadata?.assignedAt).toBeTypeOf('number');
	});

	it('is sticky — same version returns cached value without re-resolving', () => {
		const store = createStore(registry);

		// First assignment → v1
		assignExperiment({
			store,
			seed: 'seed',
			experiment: { key: 'exp_test', version: 1, variants: { v1: 50, v2: 50 } },
			resolver: fixedResolver(0),
		});

		// Second call with resolver that would return v2 — should still get v1 (sticky)
		const variant = assignExperiment({
			store,
			seed: 'seed',
			experiment: { key: 'exp_test', version: 1, variants: { v1: 50, v2: 50 } },
			resolver: fixedResolver(1),
		});

		expect(variant).toBe('v1');
	});

	it('re-assigns when version is bumped', () => {
		const store = createStore(registry);

		// v1 assigned with version 1
		assignExperiment({
			store,
			seed: 'seed',
			experiment: { key: 'exp_test', version: 1, variants: { v1: 50, v2: 50 } },
			resolver: fixedResolver(0),
		});
		expect(store.get('exp_test')).toBe('v1');

		// Version bumped to 2 — resolver now returns v2
		const variant = assignExperiment({
			store,
			seed: 'seed',
			experiment: { key: 'exp_test', version: 2, variants: { v1: 50, v2: 50 } },
			resolver: fixedResolver(1),
		});

		expect(variant).toBe('v2');
		expect(store.getRecord('exp_test')?.metadata?.experimentVersion).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// assignAllExperiments
// ---------------------------------------------------------------------------

describe('assignAllExperiments', () => {
	it('auto-discovers and assigns all experiment signals', () => {
		const registry = {
			exp_home: defineExperimentSignal({ v1: 50, v2: 50 }),
			exp_welcome: defineExperimentSignal({ original: 70, redesign: 30 }),
			non_experiment: defineSignal({ type: 'boolean', defaultValue: false }),
		} as const;

		const store = createStore(registry);
		assignAllExperiments({
			store,
			registry,
			seed: 'client-123',
			resolver: fixedResolver(0),
		});

		expect(store.get('exp_home')).toBe('v1');
		expect(store.get('exp_welcome')).toBe('original');
		expect(store.getRecord('non_experiment')).toBeUndefined();
	});

	it('skips non-experiment signals', () => {
		const registry = {
			plain_signal: defineSignal({ type: 'string' }),
		} as const;

		const store = createStore(registry);
		assignAllExperiments({
			store,
			registry,
			seed: 'seed',
			resolver: fixedResolver(0),
		});

		expect(store.getRecord('plain_signal')).toBeUndefined();
	});

	it('passes custom resolver to each experiment', () => {
		const registry = {
			exp_a: defineExperimentSignal({ x: 50, y: 50 }),
		} as const;

		const store = createStore(registry);
		assignAllExperiments({
			store,
			registry,
			seed: 'seed',
			resolver: fixedResolver(1),
		});

		expect(store.get('exp_a')).toBe('y');
	});
});
