export type AnalyticsProperties = Record<string, any> | null;
export type IAnalyticsEventMap = Record<string, AnalyticsProperties>;
export type IAnalyticsEventName<TMap extends IAnalyticsEventMap> = keyof TMap &
	string;
export type IAnalyticsEventPayload<
	TMap extends IAnalyticsEventMap,
	K extends IAnalyticsEventName<TMap>,
> = TMap[K];

export interface IAnalyticsContext {
	userId?: string;
	anonymousId?: string;
	sessionId?: string;
	platform?: string;
	appVersion?: string;
	[key: string]: unknown;
}

export interface ITrackEvent<TName extends string = string> {
	name: TName;
	properties?: AnalyticsProperties;
	context?: IAnalyticsContext;
	timestamp?: number;
}

export interface IIdentifyPayload {
	userId: string;
	traits?: AnalyticsProperties;
	context?: IAnalyticsContext;
	timestamp?: number;
}

export interface IScreenEvent {
	name: string;
	properties?: AnalyticsProperties;
	context?: IAnalyticsContext;
	timestamp?: number;
}

export interface IGroupPayload {
	groupId: string;
	traits?: AnalyticsProperties;
	context?: IAnalyticsContext;
	timestamp?: number;
}

export interface IAnalyticsProvider {
	name: string;
	track(event: ITrackEvent): void | Promise<void>;
	identify?(payload: IIdentifyPayload): void | Promise<void>;
	screen?(event: IScreenEvent): void | Promise<void>;
	group?(payload: IGroupPayload): void | Promise<void>;
	reset?(): void | Promise<void>;
	flush?(): void | Promise<void>;
}

export interface IProviderCallError {
	providerName: string;
	method: 'track' | 'identify' | 'screen' | 'group' | 'reset' | 'flush';
	error: unknown;
	payload?: unknown;
}

export interface IAnalyticsClientOptions {
	providers?: IAnalyticsProvider[];
	context?: IAnalyticsContext;
	defaultProperties?: AnalyticsProperties;
	enabled?: boolean;
	onError?: (error: IProviderCallError) => void;
}

export interface IAnalyticsClient<
	TMap extends IAnalyticsEventMap = IAnalyticsEventMap,
> {
	track(event: ITrackEvent<IAnalyticsEventName<TMap>>): void;
	track<K extends IAnalyticsEventName<TMap>>(
		name: K,
		properties: IAnalyticsEventPayload<TMap, K>,
	): void;
	identify(payload: IIdentifyPayload): void;
	screen(event: IScreenEvent): void;
	group(payload: IGroupPayload): void;
	flush(): Promise<void>;
	reset(): void;
	setEnabled(enabled: boolean): void;
	setContext(context: Partial<IAnalyticsContext>): void;
	clearContext(): void;
	setDefaultProperties(properties: AnalyticsProperties): void;
	registerProvider(provider: IAnalyticsProvider): void;
	removeProvider(providerName: string): void;
	getProviders(): IAnalyticsProvider[];
}
