# ADR 0006: Three-package design system split

## Status
Accepted

## Context
Cross-platform design systems usually take one of three shapes:
1. **One package** containing both web and mobile primitives — bundlers complain, native code leaks into web builds, RN-specific deps poison web installs.
2. **Two packages** (web + mobile) duplicating tokens — token drift is inevitable. A color update on web silently lags mobile.
3. **Three packages** — `tokens` shared, `web` and `mobile` each consuming tokens, each shipping platform-native primitives.

The third shape is the only one that survives long-term without drift or bundler grief.

## Decision
Rhitta ships three design-system packages:
- **`@rhitta/design-tokens`** — colors, typography, spacing, radii, motion. Exposed as both TypeScript constants (for runtime use) and CSS variables (for stylesheets / Tailwind themes). Platform-agnostic, zero runtime deps.
- **`@rhitta/design-system-web`** — Radix-wrapped primitives + Tailwind v4. Consumes `design-tokens`. Ships nothing native-only.
- **`@rhitta/design-system-mobile`** — Ignite-themed primitives mirroring web's API surface. Consumes `design-tokens`. Ships nothing web-only.

Web and mobile primitive APIs are kept symmetrical wherever the platform allows, so feature engineers can reason about them with one mental model.

## Consequences
- Tokens are the single source of truth — a token change propagates to both platforms via dep updates.
- Web and mobile bundles stay clean — no cross-platform code leakage.
- Cost: three packages to maintain. Worth it.
- API symmetry across platforms is intentional and enforced by code review (and eventually structure validator rules).
