import type {
	IAnalyticsContext,
	IAnalyticsProvider,
	IIdentifyPayload,
	ITrackEvent,
} from '@stackory/signals-core/analytics';
import type { PostHog } from 'posthog-node';

type IJsonValue =
	| string
	| number
	| boolean
	| null
	| IJsonValue[]
	| { [key: string]: IJsonValue };

const toJsonValue = (value: unknown): IJsonValue | undefined => {
	if (value === null) {
		return null;
	}
	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return value;
	}
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (Array.isArray(value)) {
		const normalized = value
			.map((item) => toJsonValue(item))
			.filter((item): item is IJsonValue => item !== undefined);
		return normalized;
	}
	if (typeof value === 'object') {
		const normalized: Record<string, IJsonValue> = {};
		for (const [key, objectValue] of Object.entries(value)) {
			const jsonValue = toJsonValue(objectValue);
			if (jsonValue !== undefined) {
				normalized[key] = jsonValue;
			}
		}
		return normalized;
	}
	return undefined;
};

const toJsonObject = (value?: Record<string, unknown> | null) => {
	if (!value) {
		return {};
	}
	const normalized = toJsonValue(value);
	if (
		!normalized ||
		Array.isArray(normalized) ||
		typeof normalized !== 'object'
	) {
		return {};
	}
	return normalized;
};

const resolveDistinctId = (context?: IAnalyticsContext) => {
	if (context?.userId) {
		return context.userId;
	}
	if (context?.anonymousId) {
		return context.anonymousId;
	}
	if (context?.sessionId) {
		return `mcp_session:${context.sessionId}`;
	}
	throw new Error('PostHog distinctId is required');
};

export class PosthogNodeAnalyticsProvider implements IAnalyticsProvider {
	public name = 'posthog-node';

	constructor(private posthogClient: PostHog) {}

	private buildProperties = (params: {
		properties?: Record<string, unknown> | null;
		context?: IAnalyticsContext;
	}) => {
		const { properties, context } = params;
		return {
			...toJsonObject(context),
			...toJsonObject(properties),
		};
	};

	public track = async (event: ITrackEvent) => {
		this.posthogClient.capture({
			distinctId: resolveDistinctId(event.context),
			event: event.name,
			properties: this.buildProperties({
				properties: event.properties,
				context: event.context,
			}),
		});
	};

	public identify = async (payload: IIdentifyPayload) => {
		this.posthogClient.identify({
			distinctId: resolveDistinctId({
				...payload.context,
				userId: payload.userId,
			}),
			properties: this.buildProperties({
				properties: payload.traits,
				context: payload.context,
			}),
		});
	};

	public reset = async () => {};

	public flush = async () => {
		await this.posthogClient.flush();
	};
}
