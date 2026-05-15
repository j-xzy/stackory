import type { ISignalDef } from '../signal-types';

/**
 * Discriminated union of all events emitted by UserSignalsStore.
 *
 * Plugins receive these events via their `on()` method.
 * Events are emitted synchronously — plugins must handle
 * their own async work internally.
 */
export type SignalEvent<K extends string = string> =
	| ISignalSetEvent<K>
	| ISignalClearedEvent<K>
	| ISignalHydratedEvent
	| IExperimentAssignedEvent<K>
	| IExperimentExposedEvent<K>;

export interface ISignalSetEvent<K extends string = string> {
	type: 'signal:set';
	key: K;
	value: unknown;
	source: 'local' | 'remote';
	metadata?: Record<string, unknown>;
	def?: ISignalDef;
}

export interface ISignalClearedEvent<K extends string = string> {
	type: 'signal:cleared';
	key: K;
	previousValue: unknown;
}

export interface ISignalHydratedEvent {
	type: 'signal:hydrated';
}

export interface IExperimentAssignedEvent<K extends string = string> {
	type: 'experiment:assigned';
	key: K;
	variant: string;
	version: number;
	source: 'local' | 'remote';
}

export interface IExperimentExposedEvent<K extends string = string> {
	type: 'experiment:exposed';
	key: K;
	variant: string;
	version: number;
}
