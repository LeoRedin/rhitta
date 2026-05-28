# ADR 0023: Expo Router (not React Navigation) on mobile

## Status
Accepted

## Context
React Native ships no router. The ecosystem has two production-grade choices in 2026:

- **React Navigation** — the de-facto standard for over a decade. Imperative API (`navigation.navigate('Notes', { id })`). Configuration in code. Ignite's default. Mature, widely documented, deep community ecosystem.
- **Expo Router** — file-based routing on top of React Navigation. Routes are inferred from files under `app/`. Mirrors TanStack Router's web idiom (which `apps/web` already uses per ADR-0019). Built on Expo + React Navigation 6+.

The question is **which idiom Rhitta enshrines**, not which is technically capable. Both work. Both ship realtime, deep links, modals, tabs, stacks.

Rhitta's `apps/web` (Phase 2b) uses TanStack Router's file-based routing with a `_authenticated/` pathless layout that hosts the single auth gate per AGENTS.md rule 10. The mental model is:
- Files under `src/routes/` define URLs
- Pathless layouts (`_authenticated/`) host shared layouts + auth gates
- `beforeLoad` hooks run before render

Adopting **Expo Router on mobile** lets us copy that mental model directly. Authors moving between platforms reason about one router idiom. The reference Notes screens on mobile (list / new / detail / edit / agent) sit at the same paths as web (`/notes`, `/notes/new`, `/notes/:noteId`, `/notes/:noteId/edit`, `/agent`). Deep links from emails map naturally.

Adopting **React Navigation imperative API on mobile** would force engineers to context-switch between web's declarative file-routing and mobile's imperative navigation calls. Doable, but defeats Rhitta's "one mental model per concept" goal.

Alternatives considered:
- **React Navigation only** — Ignite's default; rejected for cross-platform divergence.
- **Expo Router + sparing React Navigation imperative use** for nested cases — rejected; the inconsistency is a maintenance trap.
- **A custom abstraction wrapping both** — rejected; pointless code.

## Decision
`apps/mobile` uses **Expo Router** as the canonical router. All screens are file-based under `apps/mobile/app/`. Auth-gated routes live under `app/_authenticated/` mirroring `apps/web/src/routes/_authenticated/`. Single auth gate lives at `apps/mobile/app/_authenticated/_layout.tsx`'s `useSession` hook + `<Redirect>` to `/auth/sign-in`.

Imperative navigation (`router.push(...)`) is allowed where appropriate (e.g., post-mutation redirects) but never as a replacement for declarative routes.

Direct deep imports from `react-navigation/*` are forbidden outside `apps/mobile/app/_layout` (Expo Router internals occasionally need them). Enforced by `@rhitta/biome-config/mobile-app` `noRestrictedImports`.

## Consequences
- **Cross-platform parity in mental model.** A consumer reading web's notes detail page understands mobile's notes detail screen by looking at the equivalent file path.
- **Auth gate symmetry.** `_authenticated/_layout.tsx` on mobile is the mobile analogue of `_authenticated/route.tsx` on web. AGENTS.md rule 10 ("single auth gate location") is enforced identically.
- **Deep links** map to URLs. Marketing links / push-notification payloads can target a path string without per-platform translation.
- **Cost: divergence from Ignite's default.** The post-install overlay (ADR-0025) strips React Navigation–centric scaffolding from Ignite's output and reorganizes screens under `app/`. Documented.
- **Cost: Expo Router is younger than React Navigation.** Edge cases (modal stacks, complex tab patterns) may have less Stack Overflow coverage. Accepted — the team can drop into React Navigation internals when needed.
- **Cost: Expo Router locks `apps/mobile` to Expo.** Bare React Native projects without Expo can't use it. Acceptable — Ignite already pulls Expo as a default.
