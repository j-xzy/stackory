import {
	useCallback,
	useEffect,
	useEffectEvent,
	useRef,
	useState,
} from 'react';

interface IUseCoverflowStateOptions {
	initialIndex?: number;
	loop?: boolean;
	/**
	 * Fired after activeIndex is committed to state.
	 * Safe to reference mutable values (WebSocket, refs, etc.) — never stale.
	 */
	onChange?: (index: number, prevIndex: number) => void;
}

export function useCoverflowState(
	itemCount: number,
	options?: IUseCoverflowStateOptions,
) {
	const { initialIndex = 0, loop = true } = options ?? {};
	const [activeIndex, setActiveIndex] = useState(initialIndex);
	const prevIndexRef = useRef(activeIndex);

	const fireChange = useEffectEvent((next: number, prev: number) => {
		options?.onChange?.(next, prev);
	});

	useEffect(() => {
		const prev = prevIndexRef.current;
		if (prev === activeIndex) {
			return;
		}
		fireChange(activeIndex, prev);
		prevIndexRef.current = activeIndex;
	}, [activeIndex]);

	const goTo = useCallback((index: number) => {
		setActiveIndex(index);
	}, []);

	const prev = useCallback(() => {
		setActiveIndex((current) => {
			if (current === 0) {
				return loop ? itemCount - 1 : current;
			}
			return current - 1;
		});
	}, [itemCount, loop]);

	const next = useCallback(() => {
		setActiveIndex((current) => {
			if (current === itemCount - 1) {
				return loop ? 0 : current;
			}
			return current + 1;
		});
	}, [itemCount, loop]);

	return { activeIndex, goTo, prev, next };
}
