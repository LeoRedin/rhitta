# ADR 0021: Centralized realtime hook factory on web

## Status
Accepted

## Context
AGENTS.md rule 9 ("realtime subscriptions go through one centralized hook factory") states the discipline; this ADR concretizes the implementation.

Frontends consume realtime updates in many shapes: WebSocket, Server-Sent Events (SSE), polling, vendor SDKs (Pusher, Ably, Supabase Realtime, Encore streaming endpoints). Each transport has different reconnect semantics, auth-on-upgrade flows, and error shapes. If components subscribe to raw transports, every realtime feature reinvents the same reconnection / auth / cleanup wheel — and AI agents writing new realtime features have multiple precedents to copy from, of varying quality.

Choices for transport, in 2026:
- **Encore streaming endpoint.** Native to our stack. Authenticated via Encore session. Typed payloads. If 1.57.5 supports it cleanly, this is the cleanest fit.
- **SSE.** One-way (server → client), built into browsers, auto-reconnect via `EventSource`, no extra deps. Requires Encore raw endpoint on the API side.
- **WebSocket.** Two-way, widely supported, but manual reconnect/heartbeat/auth-on-upgrade.
- **Vendor SDK** (Pusher etc.). Forbidden by ADR-0002 unless wrapped in an adapter; we'd need a port + adapter anyway.

Phase 2a publishes one event (`NoteCreated`) via Encore Pub/Sub but ships no subscriber. Phase 2b is where the consumer lands.

## Decision
Adopt a **single centralized hook factory** for all realtime subscriptions on web (and mirror it on mobile in Phase 2c). The factory lives at:

```
apps/web/src/lib/realtime/
├── use-realtime-subscription.ts    # the only realtime hook components import
├── transport.ts                    # transport implementation (Encore streaming OR SSE)
└── index.ts
```

The exported hook signature:

```ts
export function useRealtimeSubscription<T>(
  topic: 'note-created' | 'agent-run-progress' /* ... */,
  callback: (event: T) => void,
  deps: ReadonlyArray<unknown>,
): { status: 'connecting' | 'open' | 'closed'; error: Error | null }
```

The transport implementation is hidden behind the hook. Phase 2b ships **Encore streaming if 1.57.5 supports it; SSE otherwise.** The choice is a one-file change in `transport.ts` — components are unaffected.

`@rhitta/biome-config/web-app` enforces the discipline:
- Bare `new WebSocket(...)` is banned outside `src/lib/realtime/**`.
- Bare `new EventSource(...)` is banned outside `src/lib/realtime/**`.
- Vendor realtime SDKs (`pusher-js`, `@supabase/supabase-js`'s `channel()`, etc.) are banned outside `src/lib/realtime/**`.

The `__tests__/` folders are allowlisted (test code may construct fakes).

## Consequences
- **One pattern, one mental model.** A new realtime feature copies the existing usage and gets reconnection, auth, cleanup, and typed payloads automatically.
- **Transport swaps are local.** If we move from SSE to Encore streaming (or to a vendor SDK behind an adapter) later, no component changes.
- **Auth is centralized.** The transport carries the Better Auth session cookie or token in one place.
- **Cost: the factory is non-trivial to author.** Reconnection logic, deps tracking, cleanup, typed topic registry — maybe 150-200 lines of TypeScript. Worth it once; replaces N copies of similar logic.
- **Cost: the typed topic union must be maintained.** Adding a new event means extending the union in one place. PR-visible; structure-validator can later enforce it.
- **Mobile mirrors web.** Phase 2c ships `apps/mobile/src/lib/realtime/` with the same public hook signature. Implementations differ (RN doesn't have `EventSource`; native modules or a polyfill needed), but consumers don't care.
- If the realtime feature set ever outgrows a single file (e.g., per-topic presence semantics), splitting is local to `src/lib/realtime/`. Components stay stable.
