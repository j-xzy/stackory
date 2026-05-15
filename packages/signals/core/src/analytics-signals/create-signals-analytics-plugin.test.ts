import { describe, expect, it, vi } from 'vitest';
import type { SignalEvent } from '../interfaces/signal-events';
import { defineSignal } from '../signal-types';
import { createSignalsAnalyticsPlugin } from './create-signals-analytics-plugin';

describe('createSignalsAnalyticsPlugin', () => {
	it('tracks experiment assigned and exposed by default', async () => {
		const track = vi.fn().mockResolvedValue(undefined);
		const plugin = createSignalsAnalyticsPlugin({
			analytics: { track },
		});

		plugin.on({
			type: 'experiment:assigned',
			key: 'exp_home',
			variant: 'v1',
			version: 1,
			source: 'local',
		});
		plugin.on({
			type: 'experiment:exposed',
			key: 'exp_home',
			variant: 'v1',
			version: 1,
		});

		await Promise.resolve();

		expect(track).toHaveBeenCalledTimes(2);
		expect(track.mock.calls[0]?.[0]).toMatchObject({
			name: 'experiment_assigned',
			properties: {
				experimentKey: 'exp_home',
				variant: 'v1',
				version: 1,
				source: 'local',
			},
		});
		expect(track.mock.calls[1]?.[0]).toMatchObject({
			name: 'experiment_exposed',
			properties: {
				experimentKey: 'exp_home',
				variant: 'v1',
				version: 1,
			},
		});
	});

	it('supports custom event mapping', async () => {
		const track = vi.fn().mockResolvedValue(undefined);
		const plugin = createSignalsAnalyticsPlugin({
			analytics: { track },
			mapEvent: (event) => {
				if (event.type !== 'signal:set') {
					return null;
				}
				return {
					name: 'signal_set',
					properties: {
						key: event.key,
						value: event.value,
						source: event.source,
					},
				};
			},
		});

		plugin.on({
			type: 'signal:set',
			key: 'welcome_completed',
			value: true,
			source: 'local',
			def: defineSignal({ type: 'boolean' }),
		});

		await Promise.resolve();

		expect(track).toHaveBeenCalledTimes(1);
		expect(track.mock.calls[0]?.[0]).toMatchObject({
			name: 'signal_set',
			properties: {
				key: 'welcome_completed',
				value: true,
				source: 'local',
			},
		});
	});

	it('respects disableTrack flag on signal:set by default', async () => {
		const track = vi.fn().mockResolvedValue(undefined);
		const plugin = createSignalsAnalyticsPlugin({
			analytics: { track },
			mapEvent: (event) => {
				if (event.type !== 'signal:set') {
					return null;
				}
				return { name: 'signal_set' };
			},
		});

		plugin.on({
			type: 'signal:set',
			key: 'system_theme',
			value: 'dark',
			source: 'local',
			def: defineSignal({ type: 'string', disableTrack: true }),
		});

		await Promise.resolve();

		expect(track).toHaveBeenCalledTimes(0);
	});

	it('tracks signal:set when disableTrack is false', async () => {
		const track = vi.fn().mockResolvedValue(undefined);
		const plugin = createSignalsAnalyticsPlugin({
			analytics: { track },
			mapEvent: (event) => {
				if (event.type !== 'signal:set') {
					return null;
				}
				return { name: 'signal_set' };
			},
		});

		plugin.on({
			type: 'signal:set',
			key: 'system_theme',
			value: 'dark',
			source: 'local',
			def: defineSignal({ type: 'string', disableTrack: false }),
		});

		await Promise.resolve();

		expect(track).toHaveBeenCalledTimes(1);
	});

	it('can bypass disableTrack with respectDisableTrack false', async () => {
		const track = vi.fn().mockResolvedValue(undefined);
		const plugin = createSignalsAnalyticsPlugin({
			analytics: { track },
			respectDisableTrack: false,
			mapEvent: (event) => {
				if (event.type !== 'signal:set') {
					return null;
				}
				return { name: 'signal_set' };
			},
		});

		plugin.on({
			type: 'signal:set',
			key: 'system_theme',
			value: 'dark',
			source: 'local',
			def: defineSignal({ type: 'string', disableTrack: true }),
		});

		await Promise.resolve();

		expect(track).toHaveBeenCalledTimes(1);
	});

	it('supports mapEvent returning multiple events', async () => {
		const track = vi.fn().mockResolvedValue(undefined);
		const plugin = createSignalsAnalyticsPlugin({
			analytics: { track },
			mapEvent: (event) => {
				if (event.type !== 'signal:cleared') {
					return null;
				}
				return [{ name: 'event_a' }, { name: 'event_b' }];
			},
		});

		plugin.on({
			type: 'signal:cleared',
			key: 'k',
			previousValue: 'v',
		});

		await Promise.resolve();

		expect(track).toHaveBeenCalledTimes(2);
		expect(track.mock.calls[0]?.[0]).toMatchObject({ name: 'event_a' });
		expect(track.mock.calls[1]?.[0]).toMatchObject({ name: 'event_b' });
	});

	it('reports sync mapping failures via onError', () => {
		const onError = vi.fn();
		const track = vi.fn();

		const plugin = createSignalsAnalyticsPlugin({
			analytics: { track },
			onError,
			mapEvent: (event) => {
				if (event.type === 'signal:hydrated') {
					throw new Error('mapper failed');
				}
				if (event.type === 'signal:cleared') {
					return { name: 'signal_cleared' };
				}
				return null;
			},
		});

		const hydratedEvent: SignalEvent = { type: 'signal:hydrated' };
		plugin.on(hydratedEvent);

		const clearedEvent: SignalEvent = {
			type: 'signal:cleared',
			key: 'k',
			previousValue: 'v',
		};
		plugin.on(clearedEvent);

		// Only mapper errors are reported via plugin onError.
		// Track-level errors flow through AnalyticsClient.onError instead.
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls[0]?.[1]).toEqual(hydratedEvent);

		// Successful mapping still calls track
		expect(track).toHaveBeenCalledTimes(1);
		expect(track).toHaveBeenCalledWith({ name: 'signal_cleared' });
	});
});
