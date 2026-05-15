import { describe, expect, it, vi } from 'vitest';
import { AnalyticsClient } from './analytics-client';
import type { IAnalyticsProvider, ITrackEvent } from './analytics-types';

const createProvider = (
	name: string,
): IAnalyticsProvider & {
	tracked: ITrackEvent[];
	identifyCalls: number;
	screenCalls: number;
	groupCalls: number;
	flushCalls: number;
	resetCalls: number;
} => {
	const tracked: ITrackEvent[] = [];
	let identifyCalls = 0;
	let screenCalls = 0;
	let groupCalls = 0;
	let flushCalls = 0;
	let resetCalls = 0;

	return {
		name,
		track: async (event) => {
			tracked.push(event);
		},
		identify: async () => {
			identifyCalls += 1;
		},
		screen: async () => {
			screenCalls += 1;
		},
		group: async () => {
			groupCalls += 1;
		},
		flush: async () => {
			flushCalls += 1;
		},
		reset: async () => {
			resetCalls += 1;
		},
		get tracked() {
			return tracked;
		},
		get identifyCalls() {
			return identifyCalls;
		},
		get screenCalls() {
			return screenCalls;
		},
		get groupCalls() {
			return groupCalls;
		},
		get flushCalls() {
			return flushCalls;
		},
		get resetCalls() {
			return resetCalls;
		},
	};
};

describe('AnalyticsClient', () => {
	it('fans out track to multiple providers with merged defaults/context', async () => {
		const providerA = createProvider('a');
		const providerB = createProvider('b');
		const client = new AnalyticsClient({
			providers: [providerA, providerB],
			context: { platform: 'native', appVersion: '1.0.0' },
			defaultProperties: { app: 'ootd', env: 'dev' },
		});

		await client.track('button_clicked', { env: 'prod', button: 'start' });

		for (const provider of [providerA, providerB]) {
			expect(provider.tracked).toHaveLength(1);
			expect(provider.tracked[0]).toMatchObject({
				name: 'button_clicked',
				properties: {
					app: 'ootd',
					env: 'prod',
					button: 'start',
				},
				context: {
					platform: 'native',
					appVersion: '1.0.0',
				},
			});
		}
	});

	it('isolates provider failures and reports through onError', async () => {
		const onError = vi.fn();
		const good = createProvider('good');
		const bad: IAnalyticsProvider = {
			name: 'bad',
			track: async () => {
				throw new Error('boom');
			},
		};
		const client = new AnalyticsClient({ providers: [bad, good], onError });

		await client.track('checkout_clicked', {});

		expect(good.tracked).toHaveLength(1);
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls[0]?.[0]).toMatchObject({
			providerName: 'bad',
			method: 'track',
		});
	});

	it('respects enabled flag and keeps reset always callable', async () => {
		const provider = createProvider('main');
		const client = new AnalyticsClient({
			providers: [provider],
			enabled: false,
		});

		await client.track('cta_clicked', {});
		await client.identify({ userId: 'u_1' });
		await client.flush();

		expect(provider.tracked).toHaveLength(0);
		expect(provider.identifyCalls).toBe(0);
		expect(provider.flushCalls).toBe(0);

		await client.reset();
		expect(provider.resetCalls).toBe(1);
	});

	it('registers, replaces and removes providers by name', async () => {
		const p1 = createProvider('analytics');
		const p2 = createProvider('analytics');
		const extra = createProvider('extra');
		const client = new AnalyticsClient();

		client.registerProvider(p1);
		client.registerProvider(p2);
		client.registerProvider(extra);

		expect(client.getProviders().map((provider) => provider.name)).toEqual([
			'analytics',
			'extra',
		]);

		await client.track('ping', {});
		expect(p1.tracked).toHaveLength(0);
		expect(p2.tracked).toHaveLength(1);
		expect(extra.tracked).toHaveLength(1);

		client.removeProvider('analytics');
		await client.track('pong', {});

		expect(p2.tracked).toHaveLength(1);
		expect(extra.tracked).toHaveLength(2);
	});

	it('fans out screen and group events', async () => {
		const providerA = createProvider('a');
		const providerB = createProvider('b');
		const client = new AnalyticsClient({
			providers: [providerA, providerB],
		});

		await client.screen({ name: 'home', properties: { from: 'push' } });
		await client.group({ groupId: 'org_1', traits: { plan: 'pro' } });

		expect(providerA.screenCalls).toBe(1);
		expect(providerB.screenCalls).toBe(1);
		expect(providerA.groupCalls).toBe(1);
		expect(providerB.groupCalls).toBe(1);
	});

	it('keeps initial context after clearContext and only clears runtime context', async () => {
		const provider = createProvider('main');
		const client = new AnalyticsClient({
			providers: [provider],
			context: { app_platform: 'ios' },
		});

		client.setContext({ userId: 'u_1' });
		client.clearContext();
		await client.track('screen_viewed', { screen: 'home' });

		expect(provider.tracked).toHaveLength(1);
		expect(provider.tracked[0]?.context).toEqual({
			app_platform: 'ios',
		});
	});
});
