import type { ReactNode } from 'react';
import type { ICoverflowVisualConfig } from './coverflow-utils';

export interface ICoverflowItemState {
	/** 0 = active, negative = left, positive = right */
	offset: number;
	isActive: boolean;
	isVisible: boolean;
}

export interface ICoverflowItem<T = unknown> {
	id: string;
	data: T;
}

export interface ICoverflowProps<T = unknown> {
	items: ICoverflowItem<T>[];
	activeIndex: number;
	onActiveIndexChange: (index: number) => void;
	renderItem: (
		item: ICoverflowItem<T>,
		state: ICoverflowItemState,
	) => ReactNode;
	/** Override the prev arrow. Receives the click handler and disabled state. */
	renderPrevArrow?: (onClick: () => void, disabled: boolean) => ReactNode;
	/** Override the next arrow. Receives the click handler and disabled state. */
	renderNextArrow?: (onClick: () => void, disabled: boolean) => ReactNode;
	visual?: ICoverflowVisualConfig;
	showArrows?: boolean;
	loop?: boolean;
	className?: string;
}
