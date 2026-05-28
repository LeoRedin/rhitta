# Phase 2b Resume — Tasks 39 / 40 / 41

**Date:** 2026-05-28
**For:** Fresh agent picking up Rhitta Phase 2b from `apps/web` mid-implementation.
**Repo:** `/Users/redin/Projects/personal/rhitta`
**Branch state:** `main`, HEAD `d33b2ad`, ahead of `origin/main` by 13 commits, **NOT pushed**.

---

## Read these first

1. `docs/handoffs/rhitta-phase-2b-handoff.md` — full 13-task plan. Subagent Tasks 39/40/41 map to the handoff's Implementation order items 11/12/13.
2. `docs/handoffs/rhitta-phase-2a-handoff.md` — apps/api context. Already shipped. Exposes `/notes` CRUD + `POST /agent-runs` + publishes `note-created` Pub/Sub.
3. `CONTEXT.md` — glossary. Look up "Realtime hook factory".
4. `docs/adr/0021-centralized-realtime-hook-factory.md` — drives Task 40.
5. `docs/adr/0011-lint-enforced-architectural-boundaries.md` — current web-app ban table.
6. `AGENTS.md` rules 9 (realtime via factory) + 10 (single auth gate).

Skip Phase 0 / Phase 1 / Phase 2a unless something references them.

---

## What is already shipped on `main`

13 commits (Phase 2b plan + 10 implementation tasks). See `git log d33b2ad` and the prior session's transcript. Cliffs:

- Subagent Task 29 (commit `5edbaf3`) — `@rhitta/biome-config/web-app` variant
- Task 30 (`a9f76e4`) — `apps/web` skeleton, TanStack Start
- Task 31 (`45735f9`) — `@rhitta/design-system-web` 8 primitives (37 tests)
- Task 32 (`00d0990`) — `@rhitta/design-system-web/forms` (8 tests)
- Task 33 (`b1af5b5`) — Encore client gen script + **placeholder client** (CI step deferred)
- Task 34 (`cb493a9`) — TanStack Query wrappers (8 tests)
- Task 35 (`8ceb62d`) — Better Auth React client + auth routes (3 tests)
- Task 36 (`a514a4d`) — Zustand theme + toast slices (12 tests)
- Task 37 (`1ee41fa`) — Routing skeleton + single auth gate + nav + theme toggle
- Task 38 (`d33b2ad`) — Notes pages multi-route

Total tests on HEAD: 219 (apps/api 150 + apps/web 24 + design-system-web 45).

---

## Three tasks remain

### Task 39 — Agent-run demo page

Status: prior subagent dispatch failed mid-run with a transient socket error. Repo is clean, no partial work.

Spec essentials (full spec lives in `rhitta-phase-2b-handoff.md` Task 11):

- File: `apps/web/src/routes/_authenticated/agent.tsx` → URL `/agent`
- Imports `useRunAgent` from `apps/web/src/lib/queries/index.js`
- Imports `AgentRunRequestSchema` from `@rhitta/contracts/agent-runs`
- Imports `Button`, `Card`, `Spinner` from `@rhitta/design-system-web` and `InputField`, `TextareaField`, `createZodForm` from `@rhitta/design-system-web/forms`
- Mirrors `_authenticated/notes/new.tsx` shape
- Form layout: prompt textarea + `<details>` "Advanced" disclosure for systemPrompt / model / maxTokens + run button
- Result display: `<Card>` showing `run.data.output` + token counts (`inputTokens`, `outputTokens`)
- Toast on result via `useToastQueue`
- Regenerate `routeTree.gen.ts` after adding the route. Use the Task 38 approach: programmatic `@tanstack/router-generator` Generator invocation, then re-append the `@tanstack/react-start` `Register` augmentation block that the generator strips.

Watch-out: `maxTokens` is `z.number()`. DOM input emits string. Either coerce in field `handleChange`, OR drop the field and let schema default (2048) ride. Pick the simplest path; document the choice.

Commit subject: `feat(web): agent-run demo page`. Do NOT push.

### Task 40 — API streaming endpoint + realtime hook factory

This task is the biggest of the three. Two halves.

**API side (`apps/api`):**

- Investigate Encore.ts 1.57.5 streaming endpoint support FIRST. Read `node_modules/encore.dev/api/*.d.ts`. If Encore exposes a typed streaming primitive, use it.
- Fallback: raw endpoint at `GET /events/notes` returning `text/event-stream` (SSE). Manual cookie auth, manual reconnect on client.
- Add contract domain `@rhitta/contracts/events/` exporting `NoteCreatedEventSchema` (`noteId`, `authorId`, `occurredAt`). Update `packages/contracts/package.json` exports.
- Existing `apps/api/src/lib/pub-sub.ts` already publishes `note-created` from create-note use-case.
- Streaming endpoint subscribes to the Pub/Sub topic and re-emits events filtered by `authorId === currentUserId`.
- Place at `apps/api/src/modules/notes/http/stream.ts` (or `events/` if cross-feature shape emerges).
- Update concrete `*HttpRequest`/`*HttpResponse` interfaces + `Assert<Equals<...>>` drift guards per ADR-0017 addendum.

**Web side (`apps/web`):**

- Create `apps/web/src/lib/realtime/use-realtime-subscription.ts` per ADR-0021. Signature returns `{ status: 'connecting' | 'open' | 'closed'; error: Error | null }` from a hook taking `(topic, callback, deps)`.
- Create `apps/web/src/lib/realtime/transport.ts` — hidden implementation (Encore streaming OR EventSource).
- `apps/web/src/lib/realtime/index.ts` exports only the public hook.
- Wire into `apps/web/src/routes/_authenticated/notes/index.tsx` — on `note-created`, invalidate the notes list query via TanStack Query's `queryClient.invalidateQueries`.
- Tests with a mocked transport (vi.fn fake EventSource shape).
- Add EventsNamespace to placeholder Encore client (`apps/web/src/lib/api-client/api-client.ts`) so the hook can call it without breaking typecheck. The real generated client lands later when Encore Cloud login is available.

**ADR-0011 update:** in the "Implementation status (Phase 2b)" section, flip the "realtime transports" status to shipped and add any new ban rows.

Commit subject options:
- Single: `feat(api,web): realtime hook factory with note-created subscription`
- Split (if commits become unwieldy): `feat(api): note-created streaming endpoint` + `feat(web): realtime hook factory consuming note-created`

Either is acceptable. Do NOT push.

### Task 41 — Structure-validator route convention check

10th validator check. Enforces single auth gate location per AGENTS.md rule 10.

- New file `tools/structure-validator/src/checks/route-conventions.ts` exporting `checkRouteConventions: Check`
- Logic:
  - Look for `apps/web/src/routes/_authenticated/route.tsx`
  - Fail if missing (with `adrRef: 'AGENTS.md#10'`)
  - Text-match for `beforeLoad` in file body — fail if absent
  - Vacuous pass when `apps/web/src/routes/` is absent (earlier-phase branches)
- Register in `tools/structure-validator/src/index.ts` CHECKS array
- Smoke-test: temporarily rename `route.tsx` → `route.tsx.bak`, run validator, confirm clear failure + ADR pointer, restore

Commit subject: `feat(structure-validator): route convention check for apps/web auth gate`.

---

## After Task 41

Push all 16+ commits to `origin/main` then watch CI:

`rtk proxy git push`

Then:
- `gh run list --limit 1 --repo LeoRedin/rhitta --json databaseId --jq '.[0].databaseId'`
- `gh run watch <id> --repo LeoRedin/rhitta --exit-status`

Likely CI gotcha: Task 40 adds the events contracts domain. Make sure its dist emits correctly for `apps/web` typecheck against the placeholder client. CI's existing "Build packages" step builds `packages/**` so contracts should be covered automatically.

Update `MEMORY.md` index entry for `rhitta-phases.md` after Phase 2b ships and CI passes.

---

## Known gotchas

1. **Encore client is a placeholder.** `apps/web/src/lib/api-client/api-client.ts` is hand-written; constructor throws `REGEN_HINT` at runtime. Task 6's earlier implementer added `NotesNamespace` and `AgentRunsNamespace`. Task 40 may need an `EventsNamespace`. Real generation deferred until user supplies Encore Cloud auth token.

2. **Post-login URL is `/home`, not `/`.** Task 37 renamed `_authenticated/index.tsx` to `home.tsx` because pathless layout would have collided with public root. Sign-in callback `'/'` may not redirect signed-in users to `/home` automatically — verify when wiring.

3. **TanStack Start dev server.** `pnpm --filter @rhitta/web dev` boots cleanly. `/` and `/auth/sign-in` render. Protected routes 500 because session lookup hits apps/api which isn't running locally. Expected. Task 40 testing requires either spinning up apps/api or mocking the session.

4. **biome useExhaustiveDependencies.** The realtime hook's `useEffect` may trip the rule. Use the `deps` parameter to forward consumer's deps; document any allowance.

5. **Migrations dir.** Per Phase 2a closeout, migrations live at `apps/api/src/lib/drizzle/`. Task 40 likely needs none (Pub/Sub adds no schema).

6. **Auto-mode classifier outages.** Bash + Agent dispatches occasionally hit "classifier unavailable" or 529/socket errors. Retry the same call after a brief pause.

---

## Workflow conventions

- Pattern: `superpowers:subagent-driven-development`. SKIP formal spec + code review subagents per user directive. Rely on implementer self-review + lefthook pre-commit (biome + structure-validate + typecheck) + commitlint.
- Direct-on-main is authorized for Phase 2b.
- No `Co-Authored-By` on commits. Author = Leo per global git config (`leoredin@hey.com`).
- Prefix `rtk proxy ` on all `pnpm` / `git commit` / `git push` to avoid false-OOM Linter warning from RTK shell hook. Read-only `git status` / `git log` work without it.
- One conventional commit per task with the exact subject specified.
- HEREDOC body for multi-line commit messages.
- No push during task implementation. Push once after Task 41.
- Memory at `/Users/redin/.claude/projects/-Users-redin-Projects-personal-rhitta/memory/`. Update `rhitta-phases.md` after Phase 2b ships.

---

## Acceptance

Per `rhitta-phase-2b-handoff.md` Acceptance criteria (13 items). After Tasks 39-41 + push + CI green:

- All 13 acceptance items pass
- ADRs 0019-0022 Accepted
- ADR-0011 implementation table reflects web-app bans
- `origin/main` current

Then discuss Phase 2c (`apps/mobile` Ignite scaffold) with the user.

---

## Suggested skills

- `superpowers:subagent-driven-development` — re-fire for Tasks 39 / 40 / 41
- Standard Read / Edit / Write / Bash for coordination
- `verify` at end for browser smoke test (needs apps/api running too)

Skip `grill-with-docs` — decisions locked.

---

End of resume handoff.
