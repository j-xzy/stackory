import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IDeriveScreen<ParamMap> = {
	[K in keyof ParamMap]: ParamMap[K] extends undefined
		? { name: K }
		: { name: K; params: ParamMap[K] };
}[keyof ParamMap];

export interface INavigationContext<IScreen> {
	screen: IScreen;
	push: (screen: IScreen) => void;
	pop: () => void;
	replace: (screen: IScreen) => void;
}

export type IScreenProps<ParamMap, K extends keyof ParamMap> = ParamMap[K];

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createNavigator = <ParamMap,>() => {
	type IScreen = IDeriveScreen<ParamMap>;

	const NavigationContext = createContext<INavigationContext<IScreen> | null>(
		null,
	);

	// ─── Hook ─────────────────────────────────────────────────────────────────
	// Defined early so Navigator can call it internally.

	const useNavigation = (): INavigationContext<IScreen> => {
		const ctx = useContext(NavigationContext);
		if (!ctx) {
			throw new Error('useNavigation must be used within NavigationProvider');
		}
		return ctx;
	};

	// ─── Screen ───────────────────────────────────────────────────────────────
	// Descriptor only — renders nothing, carries props for Navigator to read.

	type IScreenDescriptorProps<K extends keyof ParamMap> = {
		name: K;
		component: ParamMap[K] extends undefined
			? React.ComponentType<object>
			: React.ComponentType<NonNullable<ParamMap[K]>>;
	};

	const Screen = <K extends keyof ParamMap>(
		_props: IScreenDescriptorProps<K>,
	) => null;

	// ─── NavigationProvider ───────────────────────────────────────────────────
	// Holds navigation stack state and provides NavigationContext.
	// Siblings and children inside this provider can call useNavigation()
	// without being inside Navigator.

	const NavigationProvider = ({
		children,
		initialScreen,
	}: {
		children: React.ReactNode;
		initialScreen: IScreen;
	}) => {
		const [stack, setStack] = useState<IScreen[]>([initialScreen]);
		const screen = stack[stack.length - 1]!;

		const push = useCallback(
			(s: IScreen) => setStack((prev) => [...prev, s]),
			[],
		);
		const pop = useCallback(
			() => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev)),
			[],
		);
		const replace = useCallback(
			(s: IScreen) => setStack((prev) => [...prev.slice(0, -1), s]),
			[],
		);

		const value = useMemo(
			() => ({ screen, push, pop, replace }),
			[screen, push, pop, replace],
		);

		return <NavigationContext value={value}>{children}</NavigationContext>;
	};

	// ─── Navigator ────────────────────────────────────────────────────────────
	// Must be inside NavigationProvider. Reads current screen from context,
	// builds registry from Screen descriptor children via React.Children,
	// renders the active component.

	const Navigator = ({ children }: { children: React.ReactNode }) => {
		const { screen } = useNavigation();

		const registry = useMemo(() => {
			const map = new Map<
				string,
				React.ComponentType<Record<string, unknown>>
			>();
			React.Children.forEach(children, (child) => {
				if (React.isValidElement(child) && (child.type as unknown) === Screen) {
					const { name, component } = child.props as {
						name: string;
						component: React.ComponentType<Record<string, unknown>>;
					};
					map.set(name, component);
				}
			});
			return map;
		}, [children]);

		const ActiveComponent = registry.get(screen.name as string);
		const params =
			'params' in screen
				? (screen as { params: Record<string, unknown> }).params
				: undefined;

		return ActiveComponent ? <ActiveComponent {...(params ?? {})} /> : null;
	};

	return { NavigationProvider, Navigator, Screen, useNavigation };
};
