import type {
	AnalyticsProperties,
	IAnalyticsClient,
	IAnalyticsClientOptions,
	IAnalyticsContext,
	IAnalyticsEventMap,
	IAnalyticsEventName,
	IAnalyticsEventPayload,
	IAnalyticsProvider,
	IGroupPayload,
	IIdentifyPayload,
	IProviderCallError,
	IScreenEvent,
	ITrackEvent,
} from './analytics-types';

const mergeContext = (
	base: IAnalyticsContext,
	override?: IAnalyticsContext,
) => {
	if (!override) {
		return base;
	}
	return { ...base, ...override };
};

export class AnalyticsClient<
	TMap extends IAnalyticsEventMap = IAnalyticsEventMap,
> implements IAnalyticsClient<TMap>
{
	private providers: IAnalyticsProvider[];
	private readonly initialContext: IAnalyticsContext;
	private context: IAnalyticsContext;
	private defaultProperties: AnalyticsProperties;
	private enabled: boolean;
	private readonly onError?: (error: IProviderCallError) => void;

	constructor(options: IAnalyticsClientOptions = {}) {
		this.providers = options.providers ? [...options.providers] : [];
		this.initialContext = options.context ? { ...options.context } : {};
		this.context = {};
		this.defaultProperties = options.defaultProperties
			? { ...options.defaultProperties }
			: {};
		this.enabled = options.enabled ?? true;
		this.onError = options.onError;
	}

	private reportError = (error: IProviderCallError) => {
		if (this.onError) {
			this.onError(error);
		}
	};

	private resolveContext = (eventContext?: IAnalyticsContext) => {
		return mergeContext(
			mergeContext(this.initialContext, this.context),
			eventContext,
		);
	};

	private invokeProvider = async (
		provider: IAnalyticsProvider,
		method: IProviderCallError['method'],
		payload?: unknown,
	) => {
		try {
			switch (method) {
				case 'track': {
					await provider.track(payload as ITrackEvent);
					return;
				}
				case 'identify': {
					if (provider.identify) {
						await provider.identify(payload as IIdentifyPayload);
					}
					return;
				}
				case 'screen': {
					if (provider.screen) {
						await provider.screen(payload as IScreenEvent);
					}
					return;
				}
				case 'group': {
					if (provider.group) {
						await provider.group(payload as IGroupPayload);
					}
					return;
				}
				case 'reset': {
					if (provider.reset) {
						await provider.reset();
					}
					return;
				}
				case 'flush': {
					if (provider.flush) {
						await provider.flush();
					}
					return;
				}
			}
		} catch (error) {
			this.reportError({
				providerName: provider.name,
				method,
				error,
				payload,
			});
		}
	};

	private fanOut = async (
		method: IProviderCallError['method'],
		payload?: unknown,
	) => {
		const snapshot = [...this.providers];
		await Promise.all(
			snapshot.map((provider) =>
				this.invokeProvider(provider, method, payload),
			),
		);
	};

	track = <K extends IAnalyticsEventName<TMap>>(
		eventOrName: ITrackEvent<IAnalyticsEventName<TMap>> | K,
		properties?: IAnalyticsEventPayload<TMap, K>,
	): void => {
		if (!this.enabled) {
			return;
		}
		const event: ITrackEvent<IAnalyticsEventName<TMap>> =
			typeof eventOrName === 'string'
				? { name: eventOrName, properties: properties as AnalyticsProperties }
				: eventOrName;

		const payload: ITrackEvent = {
			...event,
			properties: {
				...this.defaultProperties,
				...(event.properties ?? {}),
			},
			context: this.resolveContext(event.context),
			timestamp: event.timestamp ?? Date.now(),
		};
		this.fanOut('track', payload).catch(() => {});
	};

	identify = (payload: IIdentifyPayload): void => {
		if (!this.enabled) {
			return;
		}

		const normalized: IIdentifyPayload = {
			...payload,
			context: this.resolveContext(payload.context),
			timestamp: payload.timestamp ?? Date.now(),
		};

		this.fanOut('identify', normalized).catch(() => {});
	};

	screen = (event: IScreenEvent): void => {
		if (!this.enabled) {
			return;
		}

		const payload: IScreenEvent = {
			...event,
			properties: {
				...this.defaultProperties,
				...(event.properties ?? {}),
			},
			context: this.resolveContext(event.context),
			timestamp: event.timestamp ?? Date.now(),
		};

		this.fanOut('screen', payload).catch(() => {});
	};

	group = (payload: IGroupPayload): void => {
		if (!this.enabled) {
			return;
		}

		const normalized: IGroupPayload = {
			...payload,
			context: this.resolveContext(payload.context),
			timestamp: payload.timestamp ?? Date.now(),
		};

		this.fanOut('group', normalized).catch(() => {});
	};

	flush = async () => {
		if (!this.enabled) {
			return;
		}
		await this.fanOut('flush');
	};

	reset = (): void => {
		// Reset is always allowed so caller can clear provider identity on logout
		// even when runtime tracking is disabled.
		this.fanOut('reset').catch(() => {});
	};

	setEnabled = (enabled: boolean) => {
		this.enabled = enabled;
	};

	setContext = (context: Partial<IAnalyticsContext>) => {
		this.context = { ...this.context, ...context };
	};

	clearContext = () => {
		this.context = {};
	};

	setDefaultProperties = (properties: AnalyticsProperties) => {
		// Replace semantics by design; caller passes the full default property bag.
		this.defaultProperties = { ...properties };
	};

	registerProvider = (provider: IAnalyticsProvider) => {
		const index = this.providers.findIndex(
			(item) => item.name === provider.name,
		);
		if (index >= 0) {
			this.providers[index] = provider;
			return;
		}
		this.providers.push(provider);
	};

	removeProvider = (providerName: string) => {
		this.providers = this.providers.filter(
			(provider) => provider.name !== providerName,
		);
	};

	getProviders = () => {
		return [...this.providers];
	};
}

export const createAnalyticsClient = <
	TMap extends IAnalyticsEventMap = IAnalyticsEventMap,
>(
	options?: IAnalyticsClientOptions,
) => {
	return new AnalyticsClient<TMap>(options);
};
