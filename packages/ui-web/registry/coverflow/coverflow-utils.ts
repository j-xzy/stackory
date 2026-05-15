import type { CSSProperties } from 'react';

export interface ICoverflowVisualConfig {
	sideCount?: number;
	scaleStep?: number;
	rotateYStep?: number;
	translateXStep?: number;
	opacityStep?: number;
	transitionDuration?: number;
	perspective?: number;
}

export type IResolvedVisualConfig = Required<ICoverflowVisualConfig>;

export const DEFAULT_VISUAL: IResolvedVisualConfig = {
	sideCount: 2,
	scaleStep: 0.15,
	rotateYStep: 35,
	translateXStep: 55,
	opacityStep: 0.15,
	transitionDuration: 400,
	perspective: 1200,
};

export function resolveVisual(
	visual?: ICoverflowVisualConfig,
): IResolvedVisualConfig {
	return { ...DEFAULT_VISUAL, ...visual };
}

/**
 * Computes the shortest circular offset from activeIndex to actualIndex.
 * Ensures items always animate via the nearest path when looping.
 * e.g. for 5 items, offset of item[0] when active=4 → +1 (right), not -4 (far left)
 */
export function calcItemOffset(
	actualIndex: number,
	activeIndex: number,
	itemCount: number,
): number {
	const rawOffset = actualIndex - activeIndex;
	const half = itemCount / 2;
	if (rawOffset > half) {
		return rawOffset - itemCount;
	}
	if (rawOffset < -half) {
		return rawOffset + itemCount;
	}
	return rawOffset;
}

export function calcItemStyle(
	offset: number,
	visual: IResolvedVisualConfig,
): CSSProperties {
	const abs = Math.abs(offset);
	const sign = Math.sign(offset);
	return {
		transform: [
			`translateX(${sign * abs * visual.translateXStep}%)`,
			`rotateY(${-sign * abs * visual.rotateYStep}deg)`,
			`scale(${1 - abs * visual.scaleStep})`,
		].join(' '),
		opacity: Math.max(0, 1 - abs * visual.opacityStep),
		zIndex: 10 - abs,
		transition: `transform ${visual.transitionDuration}ms ease, opacity ${visual.transitionDuration}ms ease`,
	};
}
