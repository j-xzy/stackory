import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ICoverflowItemState } from './coverflow.types';

interface ICoverflowItemProps {
	state: ICoverflowItemState;
	style: CSSProperties;
	onClick?: () => void;
	children: ReactNode;
}

export const CoverflowItem = ({
	state,
	style,
	onClick,
	children,
}: ICoverflowItemProps) => {
	const { isActive, isVisible } = state;

	const isClickable = !isActive && isVisible;

	return (
		<div
			className={cn(
				// Stack all items in the same grid cell
				'absolute inset-0',
				// Non-active visible items are clickable to switch
				isClickable && 'cursor-pointer',
			)}
			style={{
				...style,
				// Hide out-of-range items; opacity:0 (not visibility:hidden) allows
				// smooth transitions when items enter/leave the visible range
				...(!isVisible && { opacity: 0, pointerEvents: 'none' }),
			}}
		>
			{/* Isolate pointer events: side cards capture click on the wrapper only,
          preventing accidental interaction with inner elements (video controls, links) */}
			<div
				className='h-full'
				style={{ pointerEvents: isActive ? 'auto' : 'none' }}
			>
				{children}
			</div>
			{isClickable && (
				<button
					aria-label='Select coverflow item'
					className='absolute inset-0 cursor-pointer'
					onClick={onClick}
					type='button'
				/>
			)}
		</div>
	);
};
