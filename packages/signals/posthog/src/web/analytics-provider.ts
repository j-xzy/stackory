import type {
	IAnalyticsContext,
	IAnalyticsProvider,
	ITrackEvent,
} from '@common/signals-core/analytics';
import type { PostHog } from 'posthog-js';

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

export class PosthogAnalyticsProvider implements IAnalyticsProvider {
	public name = 'posthog';

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
		const data = this.buildProperties({
			properties: event.properties,
			context: event.context,
		});
		await this.posthogClient.capture(event.name, data);
	};

	public identify = async (payload: {
		userId: string;
		traits?: Record<string, unknown>;
		context?: IAnalyticsContext;
	}) => {
		this.posthogClient.identify(
			payload.userId,
			this.buildProperties({
				properties: payload.traits,
				context: payload.context,
			}),
		);
	};

	public screen = async (event: {
		name: string;
		properties?: Record<string, unknown>;
		context?: IAnalyticsContext;
	}) => {
		this.posthogClient.capture(
			'$pageview',
			this.buildProperties({
				properties: { ...event.properties, $current_url: event.name },
				context: event.context,
			}),
		);
	};

	public group = async (payload: {
		groupId: string;
		traits?: Record<string, unknown>;
		context?: IAnalyticsContext;
	}) => {
		this.posthogClient.group(
			'organization',
			payload.groupId,
			this.buildProperties({
				properties: payload.traits,
				context: payload.context,
			}),
		);
	};

	public reset = async () => {
		this.posthogClient.reset();
	};

	public flush = async () => {
		// posthog-js web SDK batches and sends events automatically — no manual flush needed
	};
}
