# ADR 0024: Zustand replaces MobX as the mobile state library

## Status
Accepted

## Context
AGENTS.md rule 8 mandates "TanStack Query for server state, Zustand for UI state, never duplicate server state into client state." This applies across platforms.

`apps/web` (Phase 2b) wires this directly — TanStack Query handles `/notes` and `/agent-runs`; Zustand slices hold `useTheme` and `useToastQueue`.

Ignite's mobile boilerplate ships **MobX-State-Tree (MST)** as the default state library. MST is excellent — typed, hierarchical, snapshots, time-travel debugging — but it's a different mental model from Zustand:
- MST stores are class-like observables with actions and views; Zustand stores are flat selectors over a single state slice.
- MST encourages co-locating server state in stores (cached entities, lists). Zustand explicitly forbids it for Rhitta (per AGENTS.md rule 8 — server state lives in TanStack Query).
- Engineers moving between web and mobile would face two different state idioms for the same UI-state problem.

The trade-off:
- **Keep MST on mobile** — inherits Ignite's documentation, community patterns, and tooling. But mental model diverges from web; the AGENTS.md rule has two different implementations to remember.
- **Replace MST with Zustand on mobile** — mental model parity; one library to learn; AGENTS.md rule 8 has a single implementation. But fights Ignite's idiom and the overlay (ADR-0025) must strip MST.

Alternatives considered:
- **MST on mobile, Zustand on web** — already the divergent path, rejected.
- **Zustand on both** — the parity path.
- **MST on both** — would require rewriting web's slices (already shipped). Rejected.
- **Redux Toolkit on both** — rejected; neither web nor mobile community-default.

Rhitta optimizes for mental-model parity across platforms. The cost of overriding Ignite once is smaller than the recurring cost of two state idioms.

## Decision
`apps/mobile` uses **Zustand** for UI state, identical to `apps/web`'s setup. MobX and MobX-State-Tree are NOT used and the post-install overlay (ADR-0025) strips Ignite's MST scaffolding (the `models/` directory, MST observers, store-wrapping HOCs).

`@rhitta/biome-config/mobile-app` bans imports from `mobx`, `mobx-react-lite`, and `mobx-state-tree`.

UI-state slices mirror web's structure:
- `apps/mobile/src/lib/theme/use-theme.ts` — same shape as web; persists to Expo SecureStore (RN has no localStorage).
- `apps/mobile/src/lib/toasts/use-toast-queue.ts` — identical shape; rendered via mobile design-system Toast primitive.

Server state goes through TanStack Query — never duplicated into Zustand.

## Consequences
- **Single state idiom across web + mobile.** Engineers learn Zustand once.
- **AGENTS.md rule 8 has one canonical pattern**, easier to enforce by code review and lint.
- **Cost: Ignite's MST examples + tooling are inert** for Rhitta consumers reading Ignite docs. The post-install overlay's README documents the substitution.
- **Cost: snapshot serialization** (an MST strength) requires deliberate Zustand patterns (`persist` middleware with `partialize`). Web already does this for theme; mobile copies.
- **Cost: time-travel debugging** is weaker without MST. Acceptable — not load-bearing for Rhitta consumers' use cases.
- **Future:** if a consumer needs MST for a domain-modeling use case, they can add it inside their own modules without touching Rhitta's UI slices. The ban is on cross-cutting state — domain models are different.
