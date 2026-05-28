# Rhitta — Phase 2c (`apps/mobile`) Handoff

**Date:** 2026-05-28
**For:** A fresh Claude Code session on Rhitta at end of Phase 2b (`origin/main` HEAD `e63de88` + post-grilling commit landing ADRs 0023–0025).
**Goal:** Stand up `apps/mobile` — Ignite-scaffolded React Native + Expo app patched by the `rhitta-overlay.sh` post-install script. Expo Router for navigation, Better Auth for sessions, Zustand for UI state, TanStack Query for server state, TanStack Form for forms, centralized realtime hook factory, design-system-mobile primitives mirroring web. Reference Notes screens + agent demo. This completes Rhitta v0.

---

## Prerequisites (already done)

- Phases 0, 1, 2a, 2b shipped to `main`.
- 25 ADRs (0001–0025) locked. Read **0006, 0007, 0008, 0011, 0012, 0017, 0019, 0020, 0021, 0023, 0024, 0025** thoroughly before starting.
- `apps/api` exposes `/auth/*`, `/notes`, `/notes/:id`, `POST /agent-runs`, and a streaming endpoint for `note-created` (from Phase 2b Task 40).
- `apps/web` shipped — reference for screen shape, query hooks, auth flow, realtime hook factory.
- `@rhitta/contracts` covers `notes`, `auth`, `agent-runs`, `events`, plus `shared/`.
- `@rhitta/design-tokens` ships TS constants + dual-theme CSS.
- `@rhitta/design-system-web` shipped — reference for primitive surface (Button, Input, Textarea, Label, Card, Dialog, Spinner, Toast) + `createZodForm` factory.
- `@rhitta/design-system-mobile` exists as empty-but-structured stub (Phase 1).
- `tools/structure-validator` runs 10 checks; expects `apps/mobile` mappings to be added in Task 2.
- CONTEXT.md additions: Auth gate (mobile), Rhitta overlay (mobile).

If anything is missing on the branch, reconcile before starting.

---

## Locked Phase 2c decisions (do not relitigate)

### Mobile scaffold mechanism (ADR-0025)
`npx ignite-cli new` upstream, then `apps/mobile/scripts/rhitta-overlay.sh` patches the generated files. No Ignite fork. Overlay is idempotent and re-runnable after Ignite upgrades.

### Router (ADR-0023)
**Expo Router.** File-based routing under `apps/mobile/app/`. Auth-gated routes under `app/_authenticated/`. Single auth gate at `app/_authenticated/_layout.tsx` using Better Auth's session check + `<Redirect>` to `/auth/sign-in`. URLs mirror web's paths exactly.

### State (ADR-0024 + AGENTS.md rule 8)
**Zustand for UI state, TanStack Query for server state.** Mobile slices (`useTheme`, `useToastQueue`) mirror web's shape. Theme persisted to **Expo SecureStore** (no localStorage on RN). MobX-State-Tree stripped by overlay.

### Forms (ADR-0007)
**TanStack Form.** `@rhitta/design-system-mobile/forms` exposes the same `createZodForm` factory as web. Field components wrap mobile primitives.

### Realtime (ADR-0021)
**Centralized hook factory** at `apps/mobile/src/lib/realtime/use-realtime-subscription.ts`. Same public signature as web. RN has no native `EventSource`; use `react-native-event-source` polyfill OR raw WebSocket — implementer picks at install time. Either way, only `transport.ts` knows; components see the same hook.

### Auth (ADR-0019 spirit, mobile-adapted)
**Better Auth's React client + Expo SecureStore** for token persistence. Magic link handled via Expo deep linking (URL scheme registered in Expo config; Better Auth's email contains the deep link; clicking opens the app and the link handler validates the session). Single auth gate per ADR-0023.

### Tests
**Vitest + `react-native-testing-library`.** Mirrors web's Vitest setup. Defer Maestro / e2e to Phase 3.

### Design-system-mobile primitives
**8 primitives mirroring web's surface:** Button, Input, Textarea, Label, Card, Dialog, Spinner, Toast. Native RN implementations via Ignite's themed factory consuming `@rhitta/design-tokens/semantic`. NOT NativeWind, NOT StyleSheet+inline-tokens (ADR-0008). Same `cva`-style variants where applicable.

### `@rhitta/biome-config/mobile-app` variant
New variant. Bans (similar to `web-app`):
- `mobx`, `mobx-react-lite`, `mobx-state-tree` (ADR-0024 enforcement)
- `react-navigation/*` direct imports outside `apps/mobile/app/_layout` shim files (ADR-0023 enforcement; Expo Router internals exempted)
- `better-auth` outside `src/lib/auth/**` (mirrors web)
- raw `WebSocket` / `react-native-event-source` outside `src/lib/realtime/**` (mirrors web)
- direct `fetch()` calls to API paths outside `src/lib/api-client/**`
- Vendor SDKs (`@anthropic-ai/sdk` etc.) outside their scoped adapters

### Ignite + Expo SDK versions
Implementer verifies at install time. Likely Ignite 11.x + Expo SDK 53 + RN 0.79+. Pin exact versions.

### tsconfig variant
`apps/mobile` extends `@rhitta/tsconfig/mobile.json`. Add a `@rhitta/tsconfig/mobile-app` variant (mirroring api-app + web-app pattern from Phase 2a/2b) ONLY if Expo + RN's TypeScript profile needs relaxations our base `mobile.json` doesn't cover. Verify at install time and add only if needed.

---

## Directory shape to build

```
apps/mobile/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── biome.json
├── app.json                            # Expo config (deep links, app icon, etc.)
├── metro.config.js                     # patched by overlay for monorepo
├── babel.config.js                     # Expo defaults
├── .env.example
├── scripts/
│   └── rhitta-overlay.sh               # the post-install patch script
├── app/                                # Expo Router file-based routes
│   ├── _layout.tsx                     # root layout: providers, theme
│   ├── index.tsx                       # public landing
│   ├── auth/
│   │   ├── sign-in.tsx                 # magic link + email/password
│   │   ├── sign-up.tsx
│   │   └── callback.tsx                # deep-link handler
│   └── _authenticated/
│       ├── _layout.tsx                 # SINGLE AUTH GATE
│       ├── home.tsx                    # post-login home (matches web)
│       ├── notes/
│       │   ├── index.tsx               # list
│       │   ├── new.tsx                 # create form
│       │   └── [noteId]/
│       │       ├── index.tsx           # detail + delete
│       │       └── edit.tsx            # edit form
│       └── agent.tsx                   # agent demo
└── src/
    ├── lib/
    │   ├── api-client/                 # mirrors apps/web/src/lib/api-client/
    │   ├── auth/                       # Better Auth RN client + SecureStore
    │   ├── queries/                    # TanStack Query wrappers
    │   ├── realtime/                   # use-realtime-subscription + transport
    │   ├── theme/                      # Zustand useTheme + Ignite themed factory bridge
    │   └── toasts/                     # Zustand useToastQueue
    └── server-time-config/             # if anything truly server-only persists
```

`@rhitta/design-system-mobile/src/`:

```
packages/design-system-mobile/src/
├── index.ts                            # re-exports
├── primitives/
│   ├── button.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── label.tsx
│   ├── card.tsx
│   ├── dialog.tsx                      # RN Modal-based
│   ├── spinner.tsx                     # ActivityIndicator
│   ├── toast.tsx                       # custom queue renderer
│   └── index.ts
├── forms/
│   ├── create-zod-form.ts              # MIRRORS web's API
│   ├── fields.tsx                      # InputField, TextareaField wrapping primitives
│   └── index.ts
├── theme/
│   └── themed.ts                       # bridge from @rhitta/design-tokens to Ignite themed
├── variants/
│   └── cva.ts                          # re-export (web uses same)
└── __tests__/
```

---

## Implementation order (subagent task plan)

13 sequential tasks. Each completes one commit; each must leave `pnpm validate` green.

1. **`@rhitta/biome-config/mobile-app` variant + structure-validator BIOME map.** Ships before `apps/mobile` exists.
2. **`apps/mobile` scaffold via Ignite + overlay.** Implementer runs `npx ignite-cli new`, then ships `scripts/rhitta-overlay.sh` AND runs it. The overlay strips MST, swaps in Expo Router skeleton, wires design-tokens into Ignite's theme files, patches metro.config.js for pnpm, and emplaces Rhitta's tsconfig/biome.json. Update `tools/structure-validator/src/checks/{tsconfig,biome}-inheritance.ts` maps for `apps/mobile`.
3. **`@rhitta/design-system-mobile` primitives.** Populate all 8 RN primitives via Ignite themed factory consuming `@rhitta/design-tokens/semantic`. Per-primitive Vitest + RN testing library render tests. Add Ignite + RN deps to the package.
4. **`@rhitta/design-system-mobile/forms`.** `createZodForm` factory + `InputField` + `TextareaField` mirroring web's API.
5. **`apps/mobile` Encore client.** Reuse the generation approach from web (Task 33 of Phase 2b shipped a placeholder; mobile mirrors). The script generates the same client; mobile imports it from `apps/mobile/src/lib/api-client/` (regenerated, not shared as workspace dep — RN bundler can't traverse outside `apps/mobile/`).
6. **`apps/mobile` TanStack Query wrappers.** Identical to web's `apps/web/src/lib/queries/` shape: `useNotes`, `useNote`, `useCreateNote`, `useUpdateNote`, `useDeleteNote`, `useRunAgent`.
7. **`apps/mobile` Better Auth integration.** RN client at `src/lib/auth/client.ts`. Expo SecureStore for token persistence. Magic link deep link handler (Expo Linking + URL scheme in `app.json`). `useSession` hook + server-side session resolution helper (RN has no SSR but auth resolution at root layout startup needs to happen before route guards run).
8. **`apps/mobile` Zustand slices.** `useTheme` (light/dark/system + persisted to SecureStore + applies via Ignite themed-context provider) + `useToastQueue`.
9. **`apps/mobile` Expo Router skeleton + auth gate.** `app/_layout.tsx` (root with providers), `app/_authenticated/_layout.tsx` (single auth gate), `app/index.tsx`, `app/auth/*`, `app/_authenticated/home.tsx`. Nav component with theme toggle.
10. **`apps/mobile` Notes screens.** Multi-route: list, new, detail (with delete confirmation modal), edit. Mirror web's structure exactly.
11. **`apps/mobile` agent demo screen.** Mirror web's agent page.
12. **`apps/mobile` realtime hook factory.** `useRealtimeSubscription` + transport (polyfill or WebSocket). Wire notes list to invalidate on `note-created`.
13. **Structure-validator mobile route convention check.** 11th check: confirm `apps/mobile/app/_authenticated/_layout.tsx` exists. Mirrors Phase 2b Task 41 (web's `_authenticated/route.tsx` check) using ADR-0023 reference.

---

## Acceptance criteria

Phase 2c done when **all** pass on a clean machine:

1. `pnpm install --frozen-lockfile` succeeds.
2. `pnpm typecheck` passes every workspace.
3. `pnpm lint` passes (`@rhitta/biome-config/mobile-app` bans hold).
4. `pnpm validate` runs 11 structure-validator checks; reports `[rhitta:structure] OK`.
5. `pnpm -r build` builds everything; `@rhitta/design-system-mobile` emits `.d.ts` + JS.
6. `pnpm -r test` runs Vitest across `apps/mobile` + `@rhitta/design-system-mobile`; all tests pass.
7. `pnpm --filter @rhitta/mobile start` (or `npx expo start`) boots the Metro bundler. App opens on iOS simulator + Android emulator. Sign-in shows magic link + email/password. Creating a note via `/notes/new` round-trips through `apps/api` and appears in the list. Editing, deleting, agent demo all work.
8. Realtime: a note created from another session triggers a list refresh in the mobile app via `note-created` event.
9. Dark mode toggle works; theme applied via Ignite themed factory; preference persists across app restarts (SecureStore).
10. Magic-link deep link works end-to-end: receive email, tap link, app opens, session set, redirected to `/home`.
11. ADRs 0023–0025 are `Accepted`; ADR-0011 grows rows for mobile-app bans.
12. CONTEXT.md vocab includes Auth gate (mobile), Rhitta overlay (mobile).
13. CI is green on Phase 2c PR.

---

## What Phase 2c does NOT include

- Mobile push notifications (Expo Push) — Phase 2.x.
- Background fetch / sync — Phase 2.x.
- Offline-first / local-DB cache — Phase 2.x.
- Native code beyond what Ignite ships — out of scope.
- App Store / Play Store builds — out of scope (Expo EAS in a Phase 3 ops handoff).
- E2E (Maestro / Detox) — Phase 3.
- `create-rhitta` CLI consuming the overlay — Phase 3.
- Publishing `@rhitta/*` to npm — post-validation milestone.

If you find yourself doing any of the above, stop.

---

## Working principles for the next session

- Verify versions: Ignite, Expo SDK, RN, Expo Router, react-native-event-source (if used).
- One PR worth of work titled `feat(mobile): Phase 2c — apps/mobile with reference screens, auth, realtime`.
- Conventional commits per task with the exact subject specified in each task prompt.
- Per Phase 1/2a/2b discipline: skip formal spec + code review subagents; rely on implementer self-review + `pnpm validate` gate + lefthook. Direct-on-main authorized.
- Don't ask mid-session for clarifications on locked decisions.
- Do ask if something genuinely new comes up (e.g., "Expo SDK 53 dropped support for X — here are three migration paths").

---

## Suggested skills

- `superpowers:subagent-driven-development` (same pattern as Phase 2a/2b).
- Standard tools (Read, Edit, Write, Bash).
- `verify` skill at the end for smoke testing in the simulator (needs apps/api running locally too).

Skip `grill-with-docs` — decisions locked.

---

## After Phase 2c — the validation milestone

Leo's wife's mobile app rewrite begins. Whatever breaks during that rewrite gets fixed in Rhitta v0.1 before any npm publish. Then:

- **Phase 3** — `create-rhitta` CLI (scaffolds new Rhitta projects with Ignite + overlay + all the conventions wired), extended structure-validator (module + import boundary + naming checks across all platforms), generators (`gen:module`, `gen:resource`, `gen:agent`, `gen:primitive`), Playwright e2e for web + Maestro for mobile.

Each phase = its own session with its own handoff.

---

End of Phase 2c handoff.
