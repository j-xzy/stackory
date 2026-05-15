import type {
	IAnalyticsClient,
	ITrackEvent,
} from '../analytics/analytics-types';
import type { SignalEvent } from '../interfaces/signal-events';
import type { ISignalPlugin } from '../interfaces/signal-plugin';

export interface ISignalsAnalyticsPluginOptions<K extends string = string> {
	analytics: Pick<IAnalyticsClient, 'track'>;
	name?: string;
	mapEvent?: (event: SignalEvent<K>) => ITrackEvent | ITrackEvent[] | null;
	respectDisableTrack?: boolean;
	onError?: (error: unknown, event: SignalEvent<K>) => void;
}

const mapExperimentEvent = <K extends string>(event: SignalEvent<K>) => {
	if (event.type === 'experiment:assigned') {
		return {
			name: 'experiment_assigned',
			properties: {
				experimentKey: event.key,
				variant: event.variant,
				version: event.version,
				source: event.source,
			},
		} satisfies ITrackEvent;
	}

	if (event.type === 'experiment:exposed') {
		return {
			name: 'experiment_exposed',
			properties: {
				experimentKey: event.key,
				variant: event.variant,
				version: event.version,
			},
		} satisfies ITrackEvent;
	}

	return null;
};

const shouldSkipBySignalDef = (event: SignalEvent) => {
	if (event.type !== 'signal:set') {
		return false;
	}
	return Boolean(event.def?.disableTrack);
};

const normalizeToArray = (event: ITrackEvent | ITrackEvent[] | null) => {
	if (!event) {
		return [];
	}
	if (Array.isArray(event)) {
		return event;
	}
	return [event];
};

export const createSignalsAnalyticsPlugin = <K extends string = string>(
	options: ISignalsAnalyticsPluginOptions<K>,
): ISignalPlugin<K> => {
	const {
		analytics,
		name = 'signals-analytics',
		mapEvent,
		respectDisableTrack = true,
		onError,
	} = options;

	return {
		name,
		on: (event) => {
			if (respectDisableTrack && shouldSkipBySignalDef(event)) {
				return;
			}

			try {
				const customMapped = mapEvent ? mapEvent(event) : null;
				const mapped = customMapped ?? mapExperimentEvent(event);
				const payloads = normalizeToArray(mapped);

				for (const payload of payloads) {
					analytics.track(payload);
				}
			} catch (error) {
				if (onError) {
					onError(error, event);
				}
			}
		},
	};
};
