# Rhitta — Phase 2b (`apps/web`) Handoff

**Date:** 2026-05-28
**For:** A fresh Claude Code session on Rhitta at end of Phase 2a (HEAD `37fa231` + post-grilling commit landing ADRs 0019–0022).
**Goal:** Stand up `apps/web` — TanStack Start SSR app consuming `apps/api`, populated `@rhitta/design-system-web` primitives, reference Notes pages, TanStack Form integration, centralized realtime hook factory.

---

## Prerequisites (already done)

- Phases 0, 1, 2a shipped to `main`.
- 22 ADRs (0001–0022) locked. Read **0006, 0007, 0011, 0012, 0017, 0019, 0020, 0021, 0022** thoroughly before starting.
- `@rhitta/design-tokens` ships TS constants + `/css` (`:root` + `[data-theme="dark"]`) + `/tailwind` (`@theme {}` block).
- `@rhitta/design-system-web` exists as empty-but-structured stub.
- `apps/api` exposes `/auth/*`, `/notes`, `/notes/:id`, `POST /agent-runs`; publishes `note-created` Pub/Sub event.
- `@rhitta/contracts` has `notes`, `auth`, `agent-runs` domains.
- CONTEXT.md adds: SSR, Encore client SDK, Realtime hook factory, Auth gate (web).
- Encore TS client is generatable via `encore gen client --output <path>`.

If anything is missing on the branch, reconcile before starting.

---

## Locked Phase 2b decisions (do not relitigate)

### TanStack Start setup (ADR-0019)
- **SSR-first.** Every route renders server-side. Hydration handled by TanStack Start.
- Vite config provided by TanStack Start's preset. Dev port `3000`. Production runs as a Node server (matches API deploy target per ADR-0009).
- No static-CDN deploy support in v0.

### Tailwind v4 + design-tokens
- `apps/web/src/styles/globals.css`:
  ```css
  @import "tailwindcss";
  @import "@rhitta/design-tokens/css";
  @import "@rhitta/design-tokens/tailwind";
  ```
- Dark mode via `data-theme="dark"` on `<html>`. Zustand `useTheme()` slice persists to localStorage with `prefers-color-scheme` fallback.
- Components consume **semantic** tokens only (`bg-bg-surface`, `text-text-body`, etc.) — never primitive scales (`bg-neutral-50` etc.). Brand changes flow through `@rhitta/design-tokens/src/semantic.ts`.

### API client (ADR-0020)
- Encore-generated client at `apps/web/src/lib/api-client/api-client.ts`.
- Regenerate via `pnpm --filter @rhitta/web gen:api-client`.
- Components never import the generated client directly. They call TanStack Query wrappers at `apps/web/src/lib/queries/<domain>.ts`.
- `noRestrictedImports` ban: raw `fetch()` calls to API paths flagged at lint time (handled by `@rhitta/biome-config/web-app`).

### Auth flow
- Better Auth's React client (`better-auth/react`).
- Routes: `/auth/sign-in` (magic link + email/password tabs), `/auth/sign-up`, `/auth/callback` (Better Auth handles).
- Server-side session resolution via the cookies the browser sends to TanStack Start's request handler.
- `useSession()` hook reads session in client components.

### Routing conventions
- TanStack Router file-based routing under `apps/web/src/routes/`.
- **Single auth gate** at `_authenticated/route.tsx`:
  ```tsx
  export const Route = createFileRoute('/_authenticated')({
    beforeLoad: async ({ context }) => {
      const session = await context.getSession()
      if (!session) throw redirect({ to: '/auth/sign-in' })
      return { session }
    },
  })
  ```
- Public routes: `/`, `/auth/*`. Everything else lives under `_authenticated/` and inherits the gate.
- NO per-page auth checks. Found anywhere = bug.

### Reference page shape: multi-route
- `/_authenticated/notes/` — list with cursor pagination
- `/_authenticated/notes/new` — create form
- `/_authenticated/notes/$noteId` — detail view
- `/_authenticated/notes/$noteId/edit` — edit form
- Delete is a button on detail view (modal confirmation via Dialog primitive)
- A simple agent demo page `/_authenticated/agent` calling `POST /agent-runs`

### Design system primitives in `@rhitta/design-system-web` (ADR-0022)
Phase 2b populates **8 primitives**:
- `Button` — variants `solid`/`outline`/`ghost`/`danger`; sizes `sm`/`md`/`lg`; Radix Slot for `asChild`
- `Input` — wraps native `<input>` with semantic-token styling + error state
- `Textarea` — same, for multi-line
- `Label` — Radix Label, accessibly associated
- `Card` — `<section>` with surface bg + border + radius
- `Dialog` — Radix Dialog (modal, alert variant, drawer variant)
- `Spinner` — pure CSS animation reading `--duration-normal`
- `Toast` — Radix Toast with provider + Zustand queue

Each primitive uses `class-variance-authority` (cva) for variant tables — add as a runtime dep of `@rhitta/design-system-web` if it cuts boilerplate; otherwise hand-roll.

### TanStack Form integration (ADR-0007)
- `@rhitta/design-system-web/forms` exports `createZodForm(schema)` returning `{ Field, Submit, useForm, Context }`.
- Field components wrap design-system primitives + Zod error rendering.
- Phase 2c mobile mirrors the API surface.

### Realtime (ADR-0021)
- Centralized hook factory at `apps/web/src/lib/realtime/use-realtime-subscription.ts`.
- Transport: **Encore streaming endpoint** if Encore 1.57.5 supports it on the API side; **SSE** fallback. Verify at implementation time. Either way, the public hook signature is identical.
- Implementation hidden behind the hook. `@rhitta/biome-config/web-app` bans raw `WebSocket`/`EventSource` outside `src/lib/realtime/**`.
- Reference: notes detail page subscribes to `note-created` (mainly to demonstrate the pattern; the practical use is invalidating the notes list when *another tab/session* creates a note).
- Phase 2a's API publishes `NoteCreated` but ships no subscriber endpoint — Phase 2b extends the API briefly to expose either an Encore streaming or SSE endpoint that re-publishes the Pub/Sub event to subscribed clients filtered by `authorId`.

### State management
- **TanStack Query** for server state: `useNotes()`, `useNote(id)`, `useCreateNote()`, `useUpdateNote()`, `useDeleteNote()`, `useRunAgent()` etc. Cache policies configured per query.
- **Zustand slices** for UI-only state:
  - `useTheme()` — light/dark/system + persisted to localStorage
  - `useToastQueue()` — toast notifications
  - `useDrawer()` — navigation drawer open/closed (if needed)
- **Never duplicate server state into client state.** AGENTS.md rule 8 enforced at code-review (no Biome rule can statically catch this).

### `@rhitta/biome-config/web-app` variant
New variant. Rules (per ADR-0011's table + extensions):

| Banned import | Allowed only inside |
|---------------|---------------------|
| Raw `WebSocket` constructor | `src/lib/realtime/**` |
| Raw `EventSource` constructor | `src/lib/realtime/**` |
| `@supabase/supabase-js` channel + admin | `src/lib/auth/**` (none expected in v0) |
| `better-auth` direct imports | `src/lib/auth/**` |
| `fetch` calls to API paths | `src/lib/api-client/**` (gen'd client owns these) |

Tests (`__tests__/`) allowlisted. ADR-0011's table grows; ADR-0011 stays Accepted (already flipped).

### Tests
- **Vitest + Testing Library**. Component render tests for each primitive. Use-case-style tests for queries (mock the Encore client).
- **No Playwright in 2b.** E2E lands in Phase 3 alongside generators.
- Test files under `__tests__/` adjacent to source. Single `vitest.config.ts` at `apps/web/`.

### `apps/web` tsconfig + biome
- New `@rhitta/tsconfig/web-app` variant if encountered relaxations are needed (mirrors `@rhitta/tsconfig/api-app` from Phase 2a). If not needed, extend `@rhitta/tsconfig/web.json` directly.
- `apps/web/biome.json` extends `@rhitta/biome-config/base` + `@rhitta/biome-config/react` + `@rhitta/biome-config/web-app` (per Task 27 precedent: dual/triple extends needed for formatter propagation in Biome 2.4.16).

---

## Directory shape to build

```
apps/web/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── biome.json
├── vite.config.ts                 # TanStack Start preset
├── vitest.config.ts
├── .env.example                   # web-side env vars
└── src/
    ├── routes/                    # TanStack Router file-based routes
    │   ├── __root.tsx
    │   ├── index.tsx              # landing / marketing
    │   ├── auth/
    │   │   ├── sign-in.tsx
    │   │   ├── sign-up.tsx
    │   │   └── callback.tsx       # Better Auth handles internally; this is a thin shell
    │   └── _authenticated/
    │       ├── route.tsx          # SINGLE AUTH GATE (beforeLoad)
    │       ├── index.tsx          # post-login home
    │       ├── notes/
    │       │   ├── index.tsx      # list
    │       │   ├── new.tsx        # create form
    │       │   ├── $noteId.tsx    # detail
    │       │   └── $noteId.edit.tsx
    │       └── agent.tsx          # agent-run demo
    ├── lib/
    │   ├── api-client/
    │   │   ├── api-client.ts      # GENERATED by `encore gen client`
    │   │   └── README.md          # regen command
    │   ├── auth/
    │   │   ├── client.ts          # Better Auth React client
    │   │   └── use-session.ts
    │   ├── queries/
    │   │   ├── notes.ts           # useNotes, useNote, useCreateNote, etc.
    │   │   ├── agent-runs.ts      # useRunAgent
    │   │   └── index.ts
    │   ├── realtime/
    │   │   ├── use-realtime-subscription.ts   # the only public hook
    │   │   ├── transport.ts                   # Encore streaming or SSE
    │   │   └── index.ts
    │   └── theme/
    │       └── use-theme.ts       # Zustand slice
    ├── styles/
    │   └── globals.css            # @import tailwindcss + tokens
    ├── components/                # app-specific components (not primitives)
    │   ├── nav.tsx
    │   ├── theme-toggle.tsx
    │   └── notes-list.tsx
    └── server/                    # SSR-only code (request handlers, session lookup)
        └── session.ts
```

`@rhitta/design-system-web/src/`:

```
packages/design-system-web/src/
├── index.ts                       # re-exports
├── primitives/
│   ├── button.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── label.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── spinner.tsx
│   ├── toast.tsx
│   └── index.ts
├── forms/
│   ├── create-zod-form.ts         # factory returning typed { Field, Submit, useForm, Context }
│   ├── fields.tsx                 # InputField, TextareaField wrapping primitives
│   └── index.ts
├── variants/
│   └── cva.ts                     # re-export class-variance-authority or hand-roll
└── __tests__/
    └── (per-primitive render tests)
```

---

## Implementation order (subagent task plan)

13 sequential tasks. Each completes one commit; each must leave `pnpm validate` green.

1. **`@rhitta/biome-config/web-app` variant + update structure-validator map.** Add the new variant JSON with ADR-0021's bans. Ship before `apps/web` exists so it's ready when the workspace lands. Update `tools/structure-validator/src/checks/biome-inheritance.ts` BIOME_VARIANT_MAP to expect `web-app` for `apps/web`.
2. **`apps/web` workspace skeleton.** package.json (Encore client gen script, vite, tanstack-start, react, react-dom, etc.), tsconfig/tsconfig.build/biome.json, vite.config.ts (TanStack Start preset), vitest.config.ts, .env.example, src/styles/globals.css importing Tailwind + tokens, empty src/routes/__root.tsx, src/server/.gitkeep. Update structure-validator's TSCONFIG_VARIANT_MAP for `apps/web` → `@rhitta/tsconfig/web.json` (or `web-app` variant if relaxations needed; verify).
3. **`@rhitta/design-system-web` primitives.** Populate all 8 primitives. Per-primitive Vitest + Testing Library render tests. Variant tables via cva. Add Radix dev deps to the package.
4. **`@rhitta/design-system-web/forms` integration.** `createZodForm` factory + `InputField` + `TextareaField` + `SubmitButton` wrapping primitives. TanStack Form as dep. Vitest tests with sample schemas.
5. **`apps/web` Encore client generation.** `pnpm --filter @rhitta/web gen:api-client` script. Generated client checked into the repo at `src/lib/api-client/api-client.ts` (gitignore-tracked for now; CI regenerates and diff-checks). README explains regeneration. CI runs the regen step before typecheck and fails on diff.
6. **`apps/web` TanStack Query wrappers.** `src/lib/queries/notes.ts` (useNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote), `src/lib/queries/agent-runs.ts` (useRunAgent). Cache keys, optimistic updates where appropriate.
7. **`apps/web` auth integration.** Better Auth React client at `src/lib/auth/client.ts`. `useSession()` hook. Sign-in route with magic link form + email/password form. Sign-up route. Callback route (Better Auth-managed). Server-side session resolution helper at `src/server/session.ts`.
8. **`apps/web` Zustand slices.** `useTheme()` (light/dark/system, persisted to localStorage with `prefers-color-scheme` fallback, applies `data-theme` to `<html>` on hydration). `useToastQueue()`. Tests for each slice.
9. **`apps/web` routing skeleton + auth gate.** `__root.tsx`, `_authenticated/route.tsx` (beforeLoad reading session, redirect on missing), public `/auth/*` routes, post-login `_authenticated/index.tsx`. Nav component with theme toggle.
10. **`apps/web` notes pages.** `notes/index.tsx` (list with TanStack Query + pagination), `notes/new.tsx` (TanStack Form with CreateNoteSchema), `notes/$noteId.tsx` (detail + delete dialog), `notes/$noteId.edit.tsx` (TanStack Form with UpdateNoteSchema). Component tests for each page.
11. **`apps/web` agent-run demo.** `_authenticated/agent.tsx` with a textarea input + run button + result display. TanStack Query mutation via `useRunAgent`.
12. **API streaming endpoint + `apps/web` realtime hook factory.** Extend `apps/api` to expose a streaming endpoint (Encore streaming if supported in 1.57.5, otherwise SSE via raw endpoint) that authenticates via session and emits `note-created` events filtered by `authorId`. Then `apps/web/src/lib/realtime/use-realtime-subscription.ts` + `transport.ts` consume it. Wire `notes/index.tsx` to invalidate the list on `note-created`. Verify `noRestrictedImports` bans hold.
13. **Structure-validator extension for `apps/web/src/routes/`.** Optional but recommended: a check that verifies the single auth gate is at `_authenticated/route.tsx` and exports a `beforeLoad`. Mirrors the module-shape check from Phase 2a Task 12.

---

## Acceptance criteria

Phase 2b done when **all** pass on a clean machine:

1. `pnpm install --frozen-lockfile` succeeds.
2. `pnpm typecheck` passes every workspace.
3. `pnpm lint` passes (`@rhitta/biome-config/web-app` bans hold).
4. `pnpm validate` runs 9+ structure-validator checks; reports `[rhitta:structure] OK`.
5. `pnpm -r build` builds `apps/web` to a production-ready Node SSR bundle. Builds `@rhitta/design-system-web` to `.d.ts` + JS.
6. `pnpm -r test` runs Vitest across `apps/web` + `@rhitta/design-system-web`; all tests pass.
7. `pnpm --filter @rhitta/web dev` starts the SSR dev server on port 3000. `/auth/sign-in` shows magic link + email/password tabs. `/_authenticated/notes` redirects to sign-in when unauthenticated; shows the list when authenticated.
8. Creating a note via `/_authenticated/notes/new` round-trips through `apps/api` and appears in the list. Editing + deleting work.
9. Realtime subscription: a second browser session creating a note triggers a list refresh in the first session (via `note-created` event).
10. Agent-run demo: submitting a prompt returns a Claude response (when `ANTHROPIC_API_KEY` is configured) or the in-memory adapter's placeholder (when not).
11. Dark mode toggle works; `<html data-theme="dark">` flip is observed; preference persists across refreshes.
12. ADRs 0019–0022 are `Accepted`; ADR-0011 grows a row for web-app bans.
13. CI is green on the Phase 2b PR.

---

## What Phase 2b does NOT include

- `apps/mobile` — Phase 2c.
- Real components in `@rhitta/design-system-mobile` — Phase 2c.
- OAuth provider configured — only Better Auth's scaffold + magic link + email/password.
- Background jobs, cron, multi-tenancy primitives.
- E2E Playwright tests — Phase 3.
- `create-rhitta` CLI or generators — Phase 3.
- Storybook — out of scope.
- Publishing `@rhitta/*` to npm — post-validation milestone (per Phase 0).
- Async agent runs with state machine — Phase 2.x.

If you find yourself doing any of the above, stop.

---

## Working principles for the next session

- Verify versions at runtime: TanStack Start, TanStack Router, TanStack Query, TanStack Form, Radix Primitives packages, class-variance-authority, Better Auth's React client, react, react-dom.
- **One PR worth of work** titled `feat(web): Phase 2b — apps/web with reference notes pages and realtime`.
- **Conventional commits as you go.** One per implementation-order task.
- Per Phase 1/2a discipline: skip formal spec + code review subagents; rely on implementer self-review + `pnpm validate` gate. Direct-on-main is authorized.
- Don't ask the user mid-session for clarifications on decisions in this doc.
- Do ask if something genuinely new comes up (e.g., "Encore.ts 1.57.5's streaming endpoint API differs from the docs — here are three implementation paths").

---

## Suggested skills

- Standard tools (Read, Edit, Write, Bash).
- `superpowers:subagent-driven-development` (Phase 1/2a pattern).
- `verify` skill at the end for smoke-testing the dev server.
- No grilling needed — the 22 ADRs cover the decision space.

---

## After Phase 2b

- **Phase 2c** — `apps/mobile` (Ignite scaffold + post-install overlay applying Rhitta conventions, mobile design system primitives mirroring web, reference notes screens, mobile auth via Better Auth, mobile realtime hook mirroring web).
- **Phase 3** — `create-rhitta` CLI, extended structure-validator (module + import boundary + naming + route conventions), generators (`gen:module`, `gen:resource`, `gen:agent`, `gen:primitive`), Playwright e2e.

Each phase = its own session with its own handoff.

---

## Validation milestone (unchanged)

After Phase 2c (full v0), Leo's wife's mobile app rewrite begins. Whatever breaks during that rewrite gets fixed in a Rhitta v0.1 release before EmberForge's design system migration starts. Rhitta does not publish to npm before this milestone.

---

End of Phase 2b handoff.
