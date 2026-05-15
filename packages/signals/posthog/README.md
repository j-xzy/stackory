# @stackory/signals-posthog

PostHog adapter for `@stackory/signals-core`. Implements `IAnalyticsProvider` using the PostHog web SDK (`posthog-js`).

## Rules & Guardrails

- Never call `posthog.screen()` — it does not exist on `posthog-js`. Use `posthog.capture('$pageview', { $current_url: name })` instead.
- Never call `posthog.flush()` — it does not exist on `posthog-js`. The web SDK batches and sends events automatically. `flush()` MUST remain a no-op.
- Never import from `posthog-js/react` or `@posthog/react` here — this package is framework-agnostic and wraps the raw `PostHog` instance only.
- Do NOT add React, MobX, or any UI framework to `dependencies`.
- All values passed to PostHog MUST be JSON-safe. Use `toJsonValue`/`toJsonObject` (in `analytics-provider.ts`) to normalize before passing to any PostHog method.
- Import entry point is `@stackory/signals-posthog/web`. Do not add a barrel at the package root.
- If adding a React Native adapter, create `src/native/` and add a `./native` export in `package.json` — do NOT mix web and native in `src/web/`.

## Core Project Context

- Package name: `@stackory/signals-posthog`
- Location: `common/signals/posthog/`
- Depends on: `@stackory/signals-core` (workspace), `posthog-js` (pinned)
- Public export: `@stackory/signals-posthog/web` → `PosthogAnalyticsProvider`
- Primary commands:
  - Type-check: `pnpm --filter @stackory/signals-posthog check:type`
  - Lint: `pnpm --filter @stackory/signals-posthog check:lint`
  - Build: `pnpm --filter @stackory/signals-posthog build`
- No tests currently. Add co-located `*.test.ts` files under `src/web/` when adding logic.

## Architecture Notes

- **`PosthogAnalyticsProvider`** (`src/web/analytics-provider.ts`) — sole export. Implements `IAnalyticsProvider` from `@stackory/signals-core/analytics`.
  - Constructed with a `PostHog` instance (injected by the consumer — do NOT call `posthog.init()` here).
  - Stateless: all state lives in the injected `PostHog` instance.

- **PostHog API surface actually used** (posthog-js v1.371.1):

  | Method | PostHog call |
  |--------|-------------|
  | `track` | `capture(name, properties)` |
  | `identify` | `identify(userId, properties)` |
  | `screen` | `capture('$pageview', { $current_url: name, ...props })` |
  | `group` | `group('organization', groupId, properties)` |
  | `reset` | `reset()` |
  | `flush` | no-op (SDK auto-batches) |

- **`toJsonValue` / `toJsonObject`** — private sanitizers. Strip `undefined`, coerce `Date` to ISO string, recurse into arrays and objects. Call before every PostHog method that accepts `Properties`.

- **`IAnalyticsProvider` contract** (from `@stackory/signals-core/analytics`) — all methods are `async`. PostHog calls that are synchronous (e.g., `identify`, `group`, `reset`) are wrapped with implicit `Promise` resolution; no `await` needed internally.

- **`group` hardcodes `groupType = 'organization'`** — change only if the PostHog project's group analytics configuration changes.

## Coding Style

- TypeScript strict. Prefer async/await.
- File naming: kebab-case (`analytics-provider.ts`).
- Class methods: arrow functions (`method = async () => {}`).
- Interfaces and types: prefix with `I`.
- Do NOT annotate return types on private methods — let inference handle it.
- Do NOT add `await` to void PostHog calls (`identify`, `group`, `reset`) unless the SDK adds a return value in a future version.

## Output & Collaboration Expectations

- Reference files as `common/signals/posthog/src/web/analytics-provider.ts:LINE`.
- When adding a new `IAnalyticsProvider` method: implement it in `analytics-provider.ts`, check the PostHog SDK reference for the correct call, verify JSON safety via `buildProperties`.
- When upgrading `posthog-js`: re-verify the method table above — the SDK has historically removed/renamed methods between major versions.
- Ask before changing `toJsonValue` — it is the shared sanitization boundary for all PostHog calls.

## Examples & Patterns

### Instantiate and use

```ts
import { PosthogAnalyticsProvider } from '@stackory/signals-posthog/web';
import posthog from 'posthog-js';

const provider = new PosthogAnalyticsProvider(posthog);

// In auth provider
provider.identify({ userId: user.id, traits: { email: user.email } });

// Track an event
provider.track({ name: 'user_logged_in' });

// Pageview
provider.screen({ name: window.location.href });

// Logout
provider.reset();
```

### Add a new analytics method

1. Add the method signature to `IAnalyticsProvider` in `@stackory/signals-core/analytics`.
2. Implement in `PosthogAnalyticsProvider` using an existing PostHog SDK method.
3. Sanitize all properties through `this.buildProperties(...)`.
4. Verify the PostHog method exists on the `PostHog` type — do not assume Segment-style APIs exist.
