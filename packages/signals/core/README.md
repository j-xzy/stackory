# @common/signals-core

Framework-agnostic store for user behavioral signals, feature flags, and A/B experiment assignments.

## Rules & Guardrails

- Never import UI frameworks (React, MobX, Vue, etc.) into this package — it must remain runtime-agnostic.
- Never add `mobx`, `react`, or any rendering library to `dependencies`. Zero framework deps is a design invariant.
- Do NOT add reactivity here. Reactivity belongs in the adapter layer (MobX adapter, `useSyncExternalStore`, etc.).
- Never call `notify()` before all state mutations in a single operation are complete — batch, then notify once.
- Plugins receive events synchronously. Never `await` inside `emit()`. Plugins handle their own async work.
- Plugin errors MUST be caught per-plugin so one bad plugin cannot break others or the store.
- Do NOT expose the internal `listeners` Set. Reactivity adapters use `subscribe()` only.
- `fetchRemote()` merges plugin results in registration order — later plugins override earlier. Document this when adding plugins.

## Core Project Context

- Package name: `@common/signals-core`
- Part of `common/signals/core/` in the monorepo
- Zero runtime dependencies (only `@common/core-constants` as workspace dep)
- Primary commands:
  - Type-check: `pnpm --filter @common/signals-core check:type`
  - Test: `pnpm --filter @common/signals-core check:test`
  - Lint: `pnpm --filter @common/signals-core check:lint`
  - Build: `pnpm --filter @common/signals-core build`
- All public exports go through `src/index.ts`

## Architecture Notes

- **`UserSignalsStore`** — Central state machine. Plain `Map` + `boolean`. No framework dependency.
  - Reactivity via `subscribe(listener) → unsubscribe`. Call this from adapters, not from application code directly.
  - Every write method (`set`, `setFromRemote`, `clear`, `hydrate`, `fetchRemote`, `reset`) calls `notify()` once at the end.
  - Business logic only: CRUD, plugin emission, persistence delegation, experiment metadata detection.

- **Plugin system** (`ISignalPlugin`) — Side-effect layer for analytics, remote sync, A/B assignment.
  - `on(event)` — synchronous handler for all store events (discriminated union `SignalEvent`).
  - `fetchExperiments?()` — optional async method called by `store.fetchRemote()`.
  - Plugins are registered at store construction and cannot be added/removed at runtime.

- **Persister** (`ISignalPersister`) — Required dependency injected via constructor.
  - `persist(key, record)` is synchronous — called immediately after every write.
  - `load()` is async — called once during `hydrate()`.
  - Implementations: `localStorage` (web), `AsyncStorage` (React Native), `MMKV` (React Native).

- **Signal Registry** — Defined per-project, not in this package.
  - Use `defineSignal({ type, defaultValue?, ... })` to define entries.
  - Pass the registry as the first constructor argument for full type inference on keys and values.

- **Reactivity adapters** — Live outside this package.
  - MobX: create an adapter class that subscribes and syncs state via `runInAction`.
  - React: use `useSyncExternalStore(store.subscribe, () => store.signals)`.

- **Signal priority**: `remote` source overrides `local`. This is a convention enforced by callers (`setFromRemote`), not by the store itself.

- **Experiment flow**:
  1. `set()` or `setFromRemote()` with `metadata.experimentKey` + `metadata.experimentVersion` → auto-emits `experiment:assigned`.
  2. Call `store.trackExposure(key)` when variant is rendered → emits `experiment:exposed`.

## Coding Style

- TypeScript strict. Prefer async/await.
- File naming: kebab-case (e.g., `user-signals.store.ts`, `signal-plugin.ts`).
- Interfaces and types: prefix with `I` (e.g., `ISignalPlugin`, `ISignalRecord`).
- All class methods MUST be arrow functions (`method = () => {}`). Arrow functions ensure lexical `this` binding without `makeAutoObservable` or manual `.bind()`.
- Do NOT use `void` operator to ignore promises. Use `.catch(() => {})` explicitly.
- Tests: co-located as `*.test.ts`. Use `vitest`. Test public API only — no internal state assertions.
- Do NOT add `return type` annotations to private methods unless inference fails.

## Output & Collaboration Expectations

- Reference files as `common/signals/core/src/file.ts:42`.
- When adding a new store method: update the store, add tests, confirm `notify()` is called.
- When adding a new event type: update `signal-events.ts`, update `ISignalPlugin.on()` handler signature if needed, re-export from `index.ts`.
- When adding a new plugin: implement `ISignalPlugin`, verify error isolation in tests.
- Ask before changing the `subscribe`/`notify` contract — adapters in other packages depend on it.

## Examples & Patterns

### Define a project-specific registry

```ts
import { defineSignal } from '@common/signals-core';

export const registry = {
  onboarding_completed: defineSignal({ type: 'boolean', defaultValue: false }),
  session_count: defineSignal({ type: 'number', defaultValue: 0 }),
  last_seen_at: defineSignal({ type: 'timestamp' }),
  ab_variant: defineSignal({ type: 'string' }),
} as const;

export type SignalKey = keyof typeof registry;
```

### Instantiate the store

```ts
import { UserSignalsStore } from '@common/signals-core';

const store = new UserSignalsStore(registry, {
  persister: localStoragePersister,
  plugins: [posthogPlugin],
});
```

### Implement a plugin

```ts
import type { ISignalPlugin } from '@common/signals-core';

const posthogPlugin: ISignalPlugin<SignalKey> = {
  name: 'posthog',
  on: (event) => {
    if (event.type === 'experiment:exposed') {
      posthog.capture('$feature_flag_called', {
        $feature_flag: event.key,
        $feature_flag_response: event.variant,
      });
    }
  },
};
```

### React adapter via useSyncExternalStore

```ts
import { useSyncExternalStore } from 'react';

const useSignals = (store: UserSignalsStore<typeof registry>) =>
  useSyncExternalStore(store.subscribe, () => store.signals);
```

### MobX adapter (outline)

```ts
import { observable, runInAction } from 'mobx';

class MobxSignalsAdapter {
  @observable accessor signals = store.signals;
  @observable accessor isHydrated = store.isHydrated;

  constructor(private store: UserSignalsStore<typeof registry>) {
    store.subscribe(() => {
      runInAction(() => {
        this.signals = store.signals;
        this.isHydrated = store.isHydrated;
      });
    });
  }
}
```
