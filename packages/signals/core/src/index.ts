// Adapter Interfaces
export type {
	ISignalPersister,
	IUserSignalsDeps,
} from './interfaces/signal-adapters';
// Event Types
export type {
	IExperimentAssignedEvent,
	IExperimentExposedEvent,
	ISignalClearedEvent,
	ISignalHydratedEvent,
	ISignalSetEvent,
	SignalEvent,
} from './interfaces/signal-events';
// Plugin Interface
export type { ISignalPlugin } from './interfaces/signal-plugin';
// Record Types
export {
	createEmptySignalStorage,
	type ISignalRecord,
	type ISignalStorage,
	type SignalSource,
} from './signal-record';
// Generic Signal Types (for building project-specific registries)
export {
	defineSignal,
	type InferSignalValue,
	type ISignalDef,
	type SignalType,
	type SignalTypeMap,
} from './signal-types';
// Store
export { UserSignalsStore } from './user-signals.store';
