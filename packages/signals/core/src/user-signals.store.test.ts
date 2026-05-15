import { describe, expect, it } from 'vitest';
import type { ISignalPersister } from './interfaces/signal-adapters';
import type { SignalEvent } from './interfaces/signal-events';
import type { ISignalPlugin } from './interfaces/signal-plugin';
import type { ISignalRecord } from './signal-record';
import { defineSignal } from './signal-types';
import { UserSignalsStore } from './user-signals.store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const createSpyPlugin = <K extends string = string>(): ISignalPlugin<K> & {
	events: SignalEvent<K>[];
} => {
	const events: SignalEvent<K>[] = [];
	return {
		name: 'spy',
		on: (event) => {
			events.push(event);
		},
		events,
	};
};

const registry = {
	flag: defineSignal({ type: 'boolean', defaultValue: false }),
	counter: defineSignal({ type: 'number', defaultValue: 0 }),
	name: defineSignal({ type: 'string' }),
} as const;

type K = keyof typeof registry & string;

const createStore = (plugins?: ISignalPlugin<K>[]) =>
	new UserSignalsStore(registry, {
		persister: memoryPersister<K>(),
		plugins,
	});

// ---------------------------------------------------------------------------
// Plugin event emission
// ---------------------------------------------------------------------------

describe('plugin events', () => {
	it('set() emits signal:set event', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.set('flag', true);

		expect(spy.events).toHaveLength(1);
		expect(spy.events[0]).toMatchObject({
			type: 'signal:set',
			key: 'flag',
			value: true,
			source: 'local',
		});
	});

	it('set() includes def in event', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.set('flag', true);

		const event = spy.events[0];
		expect(event.type).toBe('signal:set');
		if (event.type === 'signal:set') {
			expect(event.def?.type).toBe('boolean');
		}
	});

	it('set() emits experiment:assigned when metadata has experiment fields', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.set('name', 'v1' as never, {
			experimentKey: 'name',
			experimentVersion: 1,
			assignedAt: Date.now(),
		});

		expect(spy.events).toHaveLength(2);
		expect(spy.events[1]).toMatchObject({
			type: 'experiment:assigned',
			key: 'name',
			variant: 'v1',
			version: 1,
			source: 'local',
		});
	});

	it('set() does NOT emit experiment:assigned for non-experiment signals', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.set('flag', true);

		expect(spy.events).toHaveLength(1);
		expect(spy.events[0].type).toBe('signal:set');
	});

	it('setFromRemote() emits signal:set with source remote', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.setFromRemote('counter', 42);

		expect(spy.events[0]).toMatchObject({
			type: 'signal:set',
			key: 'counter',
			value: 42,
			source: 'remote',
		});
	});

	it('setFromRemote() emits experiment:assigned with source remote', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.setFromRemote('name', 'v2' as never, {
			experimentKey: 'name',
			experimentVersion: 2,
		});

		expect(spy.events[1]).toMatchObject({
			type: 'experiment:assigned',
			source: 'remote',
			version: 2,
		});
	});

	it('clear() emits signal:cleared with previousValue', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.set('counter', 5);
		spy.events.length = 0; // reset

		store.clear('counter');

		expect(spy.events).toHaveLength(1);
		expect(spy.events[0]).toMatchObject({
			type: 'signal:cleared',
			key: 'counter',
			previousValue: 5,
		});
	});

	it('clear() does not emit if key does not exist', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.clear('counter');

		expect(spy.events).toHaveLength(0);
	});

	it('hydrate() emits signal:hydrated', async () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		await store.hydrate();

		expect(spy.events).toHaveLength(1);
		expect(spy.events[0].type).toBe('signal:hydrated');
	});

	it('hydrate() emits only once', async () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		await store.hydrate();
		await store.hydrate();

		const hydrated = spy.events.filter((e) => e.type === 'signal:hydrated');
		expect(hydrated).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// trackExposure
// ---------------------------------------------------------------------------

describe('trackExposure', () => {
	it('emits experiment:exposed for experiment signals', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.set('name', 'v1' as never, {
			experimentKey: 'name',
			experimentVersion: 1,
		});
		spy.events.length = 0;

		store.trackExposure('name');

		expect(spy.events).toHaveLength(1);
		expect(spy.events[0]).toMatchObject({
			type: 'experiment:exposed',
			key: 'name',
			variant: 'v1',
			version: 1,
		});
	});

	it('is no-op for non-experiment signals', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.set('flag', true);
		spy.events.length = 0;

		store.trackExposure('flag');

		expect(spy.events).toHaveLength(0);
	});

	it('is no-op for unset signals', () => {
		const spy = createSpyPlugin<K>();
		const store = createStore([spy]);

		store.trackExposure('name');

		expect(spy.events).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// Plugin error isolation
// ---------------------------------------------------------------------------

describe('plugin error isolation', () => {
	it('plugin error does not break store', () => {
		const badPlugin: ISignalPlugin<K> = {
			name: 'bad',
			on: () => {
				throw new Error('boom');
			},
		};
		const store = createStore([badPlugin]);

		// Should not throw
		store.set('flag', true);
		expect(store.get('flag')).toBe(true);
	});

	it('plugin error does not block other plugins', () => {
		const badPlugin: ISignalPlugin<K> = {
			name: 'bad',
			on: () => {
				throw new Error('boom');
			},
		};
		const spy = createSpyPlugin<K>();
		const store = createStore([badPlugin, spy]);

		store.set('flag', true);

		expect(spy.events).toHaveLength(1);
		expect(spy.events[0].type).toBe('signal:set');
	});
});

// ---------------------------------------------------------------------------
// fetchRemote with plugins
// ---------------------------------------------------------------------------

describe('fetchRemote', () => {
	it('merges results from multiple plugins', async () => {
		const pluginA: ISignalPlugin<K> = {
			name: 'a',
			on: () => {},
			fetchExperiments: async () => ({
				flag: {
					key: 'flag',
					value: true,
					updatedAt: 1,
					source: 'remote',
				},
			}),
		};
		const pluginB: ISignalPlugin<K> = {
			name: 'b',
			on: () => {},
			fetchExperiments: async () => ({
				counter: {
					key: 'counter',
					value: 99,
					updatedAt: 2,
					source: 'remote',
				},
			}),
		};
		const store = createStore([pluginA, pluginB]);

		await store.fetchRemote();

		expect(store.get('flag')).toBe(true);
		expect(store.get('counter')).toBe(99);
	});

	it('later plugins override earlier ones', async () => {
		const pluginA: ISignalPlugin<K> = {
			name: 'a',
			on: () => {},
			fetchExperiments: async () => ({
				counter: {
					key: 'counter',
					value: 10,
					updatedAt: 1,
					source: 'remote',
				},
			}),
		};
		const pluginB: ISignalPlugin<K> = {
			name: 'b',
			on: () => {},
			fetchExperiments: async () => ({
				counter: {
					key: 'counter',
					value: 99,
					updatedAt: 2,
					source: 'remote',
				},
			}),
		};
		const store = createStore([pluginA, pluginB]);

		await store.fetchRemote();

		expect(store.get('counter')).toBe(99);
	});

	it('is no-op with no plugins', async () => {
		const store = createStore();
		// Should not throw
		await store.fetchRemote();
	});

	it('isolates plugin fetchExperiments errors', async () => {
		const badPlugin: ISignalPlugin<K> = {
			name: 'bad',
			on: () => {},
			fetchExperiments: async () => {
				throw new Error('network error');
			},
		};
		const goodPlugin: ISignalPlugin<K> = {
			name: 'good',
			on: () => {},
			fetchExperiments: async () => ({
				flag: {
					key: 'flag',
					value: true,
					updatedAt: 1,
					source: 'remote',
				},
			}),
		};
		const store = createStore([badPlugin, goodPlugin]);

		await store.fetchRemote();

		expect(store.get('flag')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Backward compatibility (no plugins)
// ---------------------------------------------------------------------------

describe('backward compatibility', () => {
	it('works with no plugins', () => {
		const store = createStore();

		store.set('flag', true);
		store.set('counter', 5);
		store.increment('counter');

		expect(store.get('flag')).toBe(true);
		expect(store.get('counter')).toBe(6);
		expect(store.isTrue('flag')).toBe(true);
	});
});
