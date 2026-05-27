# ADR 0008: Ignite-themed approach on mobile (not NativeWind)

## Status
Accepted

## Context
React Native styling has three popular shapes:
1. **`StyleSheet.create` with inline tokens** — verbose, easy to drift from design tokens, hard to theme.
2. **NativeWind / Tailwind on RN** — familiar to web devs but introduces a compile step, a parallel utility class system, and idiomatic divergence from Ignite's existing patterns.
3. **Ignite's themed approach** — a `useAppTheme()` hook (or equivalent) returning typed theme values consumed by `themed(styles)` factories. Already battle-tested in Ignite, integrates cleanly with `@rhitta/design-tokens`.

Rhitta's mobile app uses Ignite as the base scaffold (no fork — a post-install overlay applies Rhitta conventions). Fighting Ignite's idioms would multiply the maintenance cost of the overlay.

## Decision
Use **Ignite's themed approach** for all mobile styling. `@rhitta/design-tokens` provides the values; the design-system-mobile primitives consume them via Ignite's themed factory. **No NativeWind, no StyleSheet-with-inline-tokens.**

## Consequences
- Mobile styling stays idiomatic for anyone who knows Ignite.
- The post-install overlay applied by `create-rhitta` is small and stable.
- Token changes propagate via `@rhitta/design-tokens` without a parallel utility class system.
- Cost: web (Tailwind v4) and mobile (Ignite themed) use different mechanisms. This is acceptable — primitive *APIs* are kept symmetrical (per ADR-0006) even if the styling mechanism differs.
