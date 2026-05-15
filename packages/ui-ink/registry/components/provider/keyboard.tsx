import type { Key } from 'ink';
import { useInput } from 'ink';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from 'react';

export type IKeyHandlerFn = (input: string, key: Key) => boolean;

interface IKeyboardContext {
	registerGlobal: (handler: IKeyHandlerFn) => () => void;
	registerScreen: (handler: IKeyHandlerFn) => () => void;
	registerComponent: (
		focusId: string,
		handler: IKeyHandlerFn,
		parentId?: string,
	) => () => void;
	pushOverlay: (overlayId: string, handler: IKeyHandlerFn) => void;
	popOverlay: (overlayId: string) => void;
	claimFocus: (id: string) => void;
	yieldFocus: (id: string) => void;
}

const KeyboardContext = createContext<IKeyboardContext | null>(null);
const KeyboardScopeContext = createContext<string | undefined>(undefined);

type IComponentMeta = {
	parentId?: string;
};

export const KeyboardProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const activeLeafRef = useRef<string | null>(null);

	const globalHandlers = useRef<Set<IKeyHandlerFn>>(new Set());
	const screenHandlers = useRef<Set<IKeyHandlerFn>>(new Set());
	const componentMetaRef = useRef<Map<string, IComponentMeta>>(new Map());
	const componentHandlers = useRef<Map<string, IKeyHandlerFn>>(new Map());
	const overlayHandlers = useRef<Map<string, IKeyHandlerFn>>(new Map());
	const overlayStack = useRef<string[]>([]);

	const dispatchGlobal = useCallback((input: string, key: Key) => {
		for (const handler of globalHandlers.current) {
			if (handler(input, key)) {
				return true;
			}
		}

		return false;
	}, []);

	const dispatchOverlay = useCallback((input: string, key: Key) => {
		if (overlayStack.current.length === 0) {
			return false;
		}

		const topId = overlayStack.current[overlayStack.current.length - 1]!;
		return overlayHandlers.current.get(topId)?.(input, key) ?? false;
	}, []);

	const dispatchComponentChain = useCallback((input: string, key: Key) => {
		let currentId: string | null = activeLeafRef.current;
		while (currentId !== null) {
			const handler = componentHandlers.current.get(currentId);
			if (handler?.(input, key)) {
				return true;
			}

			currentId = componentMetaRef.current.get(currentId)?.parentId ?? null;
		}

		return false;
	}, []);

	const dispatchScreen = useCallback((input: string, key: Key) => {
		for (const handler of screenHandlers.current) {
			if (handler(input, key)) {
				return true;
			}
		}

		return false;
	}, []);

	useInput((input, key) => {
		if (dispatchOverlay(input, key)) {
			return;
		}

		if (dispatchComponentChain(input, key)) {
			return;
		}

		if (dispatchScreen(input, key)) {
			return;
		}

		dispatchGlobal(input, key);
	});

	const registerGlobal = useCallback((handler: IKeyHandlerFn) => {
		globalHandlers.current.add(handler);
		return () => {
			globalHandlers.current.delete(handler);
		};
	}, []);

	const registerScreen = useCallback((handler: IKeyHandlerFn) => {
		screenHandlers.current.add(handler);
		return () => {
			screenHandlers.current.delete(handler);
		};
	}, []);

	const registerComponent = useCallback(
		(focusId: string, handler: IKeyHandlerFn, parentId?: string) => {
			componentMetaRef.current.set(focusId, { parentId });
			componentHandlers.current.set(focusId, handler);

			return () => {
				const myParentId = componentMetaRef.current.get(focusId)?.parentId;

				componentMetaRef.current.delete(focusId);
				componentHandlers.current.delete(focusId);

				for (const [childId, childMeta] of componentMetaRef.current) {
					if (childMeta.parentId === focusId) {
						componentMetaRef.current.set(childId, {
							...childMeta,
							parentId: myParentId,
						});
					}
				}

				if (activeLeafRef.current === focusId) {
					let currentId: string | undefined = myParentId;

					while (currentId !== undefined) {
						if (componentMetaRef.current.has(currentId)) {
							activeLeafRef.current = currentId;
							return;
						}

						currentId = componentMetaRef.current.get(currentId)?.parentId;
					}

					activeLeafRef.current = null;
				}
			};
		},
		[],
	);

	const pushOverlay = useCallback(
		(overlayId: string, handler: IKeyHandlerFn) => {
			overlayHandlers.current.set(overlayId, handler);
			overlayStack.current = [...overlayStack.current, overlayId];
		},
		[],
	);

	const popOverlay = useCallback((overlayId: string) => {
		overlayHandlers.current.delete(overlayId);
		overlayStack.current = overlayStack.current.filter(
			(id) => id !== overlayId,
		);
	}, []);

	const claimFocus = useCallback((id: string) => {
		activeLeafRef.current = id;
	}, []);

	const yieldFocus = useCallback((id: string) => {
		if (activeLeafRef.current !== id) {
			return;
		}

		let currentId: string | undefined =
			componentMetaRef.current.get(id)?.parentId;

		while (currentId !== undefined) {
			if (componentMetaRef.current.has(currentId)) {
				activeLeafRef.current = currentId;
				return;
			}

			currentId = componentMetaRef.current.get(currentId)?.parentId;
		}

		activeLeafRef.current = null;
	}, []);

	return (
		<KeyboardContext
			value={{
				registerGlobal,
				registerScreen,
				registerComponent,
				pushOverlay,
				popOverlay,
				claimFocus,
				yieldFocus,
			}}
		>
			{children}
		</KeyboardContext>
	);
};

const useKeyboard = () => {
	const ctx = useContext(KeyboardContext);
	if (!ctx) {
		throw new Error('useKeyboard must be used within KeyboardProvider');
	}

	return ctx;
};

export const KeyboardScope = ({
	children,
	scopeId,
}: {
	children: React.ReactNode;
	scopeId: string;
}) => (
	<KeyboardScopeContext.Provider value={scopeId}>
		{children}
	</KeyboardScopeContext.Provider>
);

export const useGlobalKeyHandler = (handler: IKeyHandlerFn) => {
	const { registerGlobal } = useKeyboard();
	const ref = useRef(handler);
	ref.current = handler;

	useEffect(
		() => registerGlobal((input, key) => ref.current(input, key)),
		[registerGlobal],
	);
};

export const useScreenKeyHandler = (handler: IKeyHandlerFn) => {
	const { registerScreen } = useKeyboard();
	const ref = useRef(handler);
	ref.current = handler;

	useEffect(
		() => registerScreen((input, key) => ref.current(input, key)),
		[registerScreen],
	);
};

export const useLeafKeyHandler = (
	focusId: string,
	handler: IKeyHandlerFn,
	isActive = true,
) => {
	const parentId = useContext(KeyboardScopeContext);
	const { registerComponent, claimFocus, yieldFocus } = useKeyboard();
	const ref = useRef(handler);
	ref.current = handler;

	useEffect(
		() =>
			registerComponent(
				focusId,
				(input, key) => ref.current(input, key),
				parentId,
			),
		[focusId, parentId, registerComponent],
	);

	useEffect(() => {
		if (isActive) {
			claimFocus(focusId);
			return;
		}

		yieldFocus(focusId);
	}, [claimFocus, focusId, isActive, yieldFocus]);
};

export const useContainerKeyHandler = (
	scopeId: string,
	handler: IKeyHandlerFn,
) => {
	const parentId = useContext(KeyboardScopeContext);
	const { registerComponent } = useKeyboard();
	const ref = useRef(handler);
	ref.current = handler;

	useEffect(
		() =>
			registerComponent(
				scopeId,
				(input, key) => ref.current(input, key),
				parentId,
			),
		[parentId, registerComponent, scopeId],
	);
};

export const useOverlayKeyHandler = (
	overlayId: string,
	handler: IKeyHandlerFn,
) => {
	const { pushOverlay, popOverlay } = useKeyboard();
	const ref = useRef(handler);
	ref.current = handler;

	useEffect(() => {
		pushOverlay(overlayId, (input, key) => ref.current(input, key));
		return () => {
			popOverlay(overlayId);
		};
	}, [overlayId, popOverlay, pushOverlay]);
};
