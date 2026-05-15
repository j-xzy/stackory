import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ICoverflowItemState, ICoverflowProps } from './coverflow.types';
import { CoverflowItem } from './coverflow-item';
import {
	calcItemOffset,
	calcItemStyle,
	resolveVisual,
} from './coverflow-utils';

const DefaultArrow = ({
	direction,
	onClick,
	disabled,
}: {
	direction: 'prev' | 'next';
	onClick: () => void;
	disabled: boolean;
}) => (
	<button
		className={cn(
			'absolute top-1/2 z-20 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 shadow-md backdrop-blur-sm transition-opacity',
			direction === 'prev' ? 'left-2' : 'right-2',
			disabled && 'pointer-events-none opacity-30',
		)}
		disabled={disabled}
		onClick={onClick}
		type='button'
	>
		{direction === 'prev' ? (
			<ChevronLeft className='size-4' />
		) : (
			<ChevronRight className='size-4' />
		)}
	</button>
);

export const Coverflow = <T = unknown>({
	items,
	activeIndex,
	onActiveIndexChange,
	renderItem,
	renderPrevArrow,
	renderNextArrow,
	visual: visualProp,
	showArrows = true,
	loop = true,
	className,
}: ICoverflowProps<T>) => {
	const visual = resolveVisual(visualProp);
	const isAtStart = !loop && activeIndex === 0;
	const isAtEnd = !loop && activeIndex === items.length - 1;

	const handlePrev = () => {
		if (isAtStart) {
			return;
		}
		onActiveIndexChange(activeIndex === 0 ? items.length - 1 : activeIndex - 1);
	};

	const handleNext = () => {
		if (isAtEnd) {
			return;
		}
		onActiveIndexChange(activeIndex === items.length - 1 ? 0 : activeIndex + 1);
	};

	return (
		<div className={cn('relative h-full', className)}>
			{showArrows &&
				(renderPrevArrow ? (
					renderPrevArrow(handlePrev, isAtStart)
				) : (
					<DefaultArrow
						direction='prev'
						disabled={isAtStart}
						onClick={handlePrev}
					/>
				))}

			{/* perspective on relative container enables rotateY depth for all children */}
			<div
				className='relative h-full'
				style={{ perspective: `${visual.perspective}px` }}
			>
				{items.map((item, actualIndex) => {
					const offset = calcItemOffset(actualIndex, activeIndex, items.length);
					const isVisible = Math.abs(offset) <= visual.sideCount;
					const state: ICoverflowItemState = {
						offset,
						isActive: offset === 0,
						isVisible,
					};

					return (
						<CoverflowItem
							key={item.id}
							onClick={() => onActiveIndexChange(actualIndex)}
							state={state}
							style={calcItemStyle(offset, visual)}
						>
							{renderItem(item, state)}
						</CoverflowItem>
					);
				})}
			</div>

			{showArrows &&
				(renderNextArrow ? (
					renderNextArrow(handleNext, isAtEnd)
				) : (
					<DefaultArrow
						direction='next'
						disabled={isAtEnd}
						onClick={handleNext}
					/>
				))}
		</div>
	);
};
