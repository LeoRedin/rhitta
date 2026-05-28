# Rhitta — Phase 2a (`apps/api`) Handoff

**Date:** 2026-05-27
**For:** A fresh Claude Code session on Rhitta repo at end of Phase 1 (commits up to `83ca9a2`)
**Goal:** Stand up `apps/api` — the Encore.ts service that demonstrates Rhitta's full hexagonal + module-DI architecture with a reference resource (Note) and a reference agent run.

---

## Prerequisites (already done in Phase 0 and Phase 1)

- pnpm workspaces, Biome 2.x, lefthook, commitlint, changesets fixed mode, Node 22.22.3 pinned.
- `@rhitta/tsconfig` (four variants), `@rhitta/biome-config` (base + react), `@rhitta/design-tokens` (two-layer + dual theme), `@rhitta/contracts` (skeleton with `shared/` only).
- `@rhitta/design-system-web` and `@rhitta/design-system-mobile` exist as empty-but-structured stubs.
- `tools/structure-validator` runs 8 checks across the workspace.
- `.github/workflows/{ci,release}.yml` in place.
- ADRs 0001–0018. Read 0002, 0003, 0004, 0005, 0009, 0013, 0015, 0016, 0017, 0018 thoroughly before starting.
- CONTEXT.md glossary covers: Use-case, Reference resource (= Note), Agent run, Domain error, Event publisher, Migration.

If anything above is missing, reconcile before starting Phase 2a.

---

## Locked Phase 2a decisions (do not relitigate)

These were resolved in a grilling session before this handoff. Driving ADRs cited inline.

### Encore service shape (ADR-0015)
One Encore.ts service named `api`. All modules live inside it. The Encore service manifest at `apps/api/encore.app` or `apps/api/src/encore.app.ts` declares this single service.

### ORM and migrations (ADR-0016)
Drizzle ORM + Drizzle Kit. Schema declared in TS under each module's `infra/schema.ts`. Migrations are forward-only SQL files under each module's `infra/migrations/`. Repositories use Drizzle's query builder internally but expose domain-shaped methods only.

### HTTP layer pattern (ADR-0017)
Encore native `api()` declarations using TS types from `z.infer<typeof Schema>`. Every handler explicitly calls `Schema.parse(req)` on input and `ResponseSchema.parse(outbound)` on response. Belt + braces.

### Errors (ADR-0018)
`DomainError` base class with taxonomic subclasses (`NotFoundError`, `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `RateLimitedError`, `DependencyFailureError`). Central mapper at `apps/api/src/lib/error-mapper.ts`. Handlers end with `try { ... } catch (e) { throw mapError(e) }`. Use-cases never reference HTTP.

### Reference resource: Note
A user-owned, soft-deletable, paginated note. Demonstrates branded IDs (`NoteId`), Zod schemas at every boundary, the full domain → application → infra → http stack, and pairs naturally with the agent-run demo (an agent can summarize or expand a note in v0.1+).

### Reference agent run: synchronous HTTP
`POST /agent-runs { input } → { output }`. Blocks until done. Demonstrates the `AgentProvider` port with an Anthropic Claude adapter. Async runs with a state machine are a future extension; the port is shaped to permit both.

### External provider defaults
- **Auth:** Better Auth with magic-link + email/password methods. OAuth scaffold wired but no provider enabled.
- **Email:** Resend.
- **Storage:** S3-compatible adapter; default config targets Cloudflare R2 (free egress).
- **Agent:** Anthropic Claude (`@anthropic-ai/sdk`).
- Every adapter is paired with an in-memory adapter used by use-case tests.

### Tests
Vitest. Lands here for the first time (Phase 0 deferred; Phase 2a is the "later phase").

- **Use-case tests:** unit, with in-memory adapters. Required for every use-case.
- **Repository tests:** integration against an ephemeral Postgres via Testcontainers OR Encore's test DB. Required for every repository.
- **HTTP tests:** one happy-path + one error-path per endpoint via Encore's test harness or supertest-on-Encore.
- Coverage threshold: not enforced in Phase 2a; revisit in Phase 3 when CI generators stabilize.

### Pub/Sub
`EventPublisher` port in `apps/api/src/lib/pub-sub.ts`. Default adapter wraps Encore's native Pub/Sub. Phase 2a publishes **one event**: `NoteCreated` (after a note is created). **No subscribers.** Demonstrates the seam without forcing event-handler infrastructure.

### Realtime backend
Deferred to Phase 2b/2c. The event publisher port stays generic; subscribers (and transport choice between WebSocket / SSE / Encore streaming) land when web/mobile clients need them.

---

## Directory shape to build

```
apps/api/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── biome.json
├── vitest.config.ts
├── drizzle.config.ts
├── Dockerfile
├── encore.app                      # Encore service manifest
└── src/
    ├── lib/
    │   ├── composeRoot.ts          # wires modules together at startup
    │   ├── error-mapper.ts         # DomainError -> Encore APIError
    │   ├── errors.ts               # shared domain error base + subclasses
    │   ├── auth-gate.ts            # Better Auth integration with Encore
    │   ├── pub-sub.ts              # EventPublisher port + Encore adapter
    │   ├── db.ts                   # Drizzle connection setup (shared pool)
    │   └── test-utils.ts           # in-memory adapter helpers
    ├── modules/
    │   ├── auth/
    │   │   ├── domain/             # AuthSession value object
    │   │   ├── application/        # currently empty — Better Auth owns flows
    │   │   ├── infra/
    │   │   │   ├── better-auth-adapter.ts
    │   │   │   ├── schema.ts       # users, sessions, accounts (Better Auth tables)
    │   │   │   └── migrations/
    │   │   └── http/
    │   │       └── auth-handler.ts # mounts Better Auth's handler at /auth/*
    │   ├── notes/
    │   │   ├── domain/
    │   │   │   ├── note.ts         # Note class with invariants
    │   │   │   └── errors.ts       # NoteNotFoundError, etc.
    │   │   ├── application/
    │   │   │   ├── create-note.ts
    │   │   │   ├── get-note.ts
    │   │   │   ├── list-notes.ts
    │   │   │   ├── update-note.ts
    │   │   │   └── delete-note.ts
    │   │   ├── infra/
    │   │   │   ├── postgres-note-repository.ts
    │   │   │   ├── in-memory-note-repository.ts
    │   │   │   ├── schema.ts       # notes table
    │   │   │   └── migrations/
    │   │   ├── http/
    │   │   │   ├── create.ts       # POST /notes
    │   │   │   ├── get.ts          # GET /notes/:id
    │   │   │   ├── list.ts         # GET /notes
    │   │   │   ├── update.ts       # PATCH /notes/:id
    │   │   │   └── delete.ts       # DELETE /notes/:id
    │   │   ├── module.ts           # registerNotesModule(deps)
    │   │   └── __tests__/          # use-case + repository tests
    │   └── agent-runs/
    │       ├── domain/
    │       │   ├── agent-run.ts
    │       │   └── errors.ts
    │       ├── application/
    │       │   └── run-agent.ts
    │       ├── infra/
    │       │   ├── anthropic-agent-adapter.ts
    │       │   ├── in-memory-agent-adapter.ts
    │       │   └── agent-provider.ts  # port (interface)
    │       ├── http/
    │       │   └── run.ts          # POST /agent-runs
    │       ├── module.ts
    │       └── __tests__/
    ├── adapters/
    │   ├── resend-email-adapter.ts
    │   ├── s3-storage-adapter.ts   # also serves R2 (S3-compatible API)
    │   ├── in-memory-email-adapter.ts
    │   └── in-memory-storage-adapter.ts
    └── encore.app.ts               # service manifest
```

(File count: ~50. Substantial phase. Plan for multiple subagent dispatches.)

---

## `@rhitta/contracts` additions in Phase 2a

Three new domain folders inside `packages/contracts/src/`:

```
packages/contracts/src/
├── shared/                       # existing
├── notes/
│   ├── note.ts                  # NoteIdSchema, NoteSchema, CreateNoteSchema, UpdateNoteSchema, ListNotesQuerySchema
│   └── index.ts
├── auth/
│   ├── user.ts                  # UserIdSchema, UserSchema (the public view of a Better Auth user)
│   ├── session.ts               # SessionSchema
│   └── index.ts
└── agent-runs/
    ├── run.ts                   # AgentRunIdSchema, AgentRunRequestSchema, AgentRunResponseSchema
    └── index.ts
```

Update `packages/contracts/package.json` `exports` to add `./notes`, `./auth`, `./agent-runs`. Each domain folder gets entry in the exports map (per ADR-0013 — explicit enumeration).

---

## Implementation order (subagent task plan)

These are sequential and must run one at a time (shared root files: `package.json`, `pnpm-lock.yaml`, the structure-validator's variant map).

1. **Contracts domains.** Add `notes/`, `auth/`, `agent-runs/` to `@rhitta/contracts`. Update `package.json` exports. Verify `pnpm --filter @rhitta/contracts build` emits the new subpaths.
2. **`apps/api` skeleton.** Create the workspace shell: `package.json`, `tsconfig*.json`, `biome.json`, `vitest.config.ts`, `drizzle.config.ts`, `encore.app` (or `src/encore.app.ts`), empty `src/lib/` and `src/modules/` and `src/adapters/` directories. Update `tools/structure-validator/src/checks/tsconfig-inheritance.ts` mapping to include `'apps/api': '@rhitta/tsconfig/node.json'` and `biome-inheritance.ts` mapping for `'apps/api': '@rhitta/biome-config/base'`. Verify `pnpm validate` passes against the empty skeleton.
3. **`lib/`: shared cross-cutting code.** `errors.ts` (DomainError base + 7 subclasses), `error-mapper.ts`, `db.ts` (Drizzle connection — uses Encore's `SQLDatabase` primitive for the connection), `pub-sub.ts` (EventPublisher port + Encore adapter), `auth-gate.ts` (Better Auth wrapper exposing `getCurrentUser()`), `composeRoot.ts` (wires modules), `test-utils.ts`.
4. **`modules/auth`.** Better Auth schema + migrations. The `auth-handler.ts` mounts Better Auth's handler at `/auth/*` using Encore raw endpoints. `auth-gate.ts` in `lib/` reads session via Better Auth. No application layer needed yet — auth flows are handled by Better Auth's own UI/client.
5. **`modules/notes` domain + application.** Domain class `Note` with invariants (title length, body length, soft-delete state machine). Use-cases for CRUD + list. In-memory repository for tests. Unit tests for every use-case using in-memory adapters.
6. **`modules/notes` infra (Drizzle).** Schema + migrations + Postgres repository implementation. Repository integration tests against ephemeral Postgres.
7. **`modules/notes` http layer.** Five HTTP handlers. Each handler follows the ADR-0017 belt-and-braces pattern. Auth-gated via `auth-gate.ts`. Integration tests covering happy + error paths per endpoint. `NoteCreated` event published from the create use-case.
8. **External adapters.** `resend-email-adapter.ts`, `s3-storage-adapter.ts`, `in-memory-*-adapter.ts`. Each behind a port interface (ports live alongside use-cases that need them; `EmailSender` and `StoragePort` in `apps/api/src/lib/` since they're not feature-owned). Smoke tests with in-memory adapters.
9. **`modules/agent-runs`.** Domain + use-case + `AgentProvider` port + Anthropic adapter + in-memory adapter + http endpoint. Tests use in-memory.
10. **`composeRoot.ts` wiring.** Assemble all modules. Read env vars. Initialize adapters with credentials. Return the composed app.
11. **Dockerfile + deploy hardening.** Multi-stage build, non-root user, proper signal handling. Document env vars required at runtime in a `.env.example` file.
12. **Update structure-validator's variant maps + add module structure check.** Extend `tools/structure-validator/src/checks/workspace-shape.ts` to enforce that every `apps/api/src/modules/<feature>/` has `domain/`, `application/`, `infra/`, `http/`, and `module.ts`. Mark this as an ADR-0003 enforced check.
13. **Bias `@rhitta/biome-config` toward the planned bans** (ADR-0011 implementation). Add `noRestrictedImports` rules to a new `@rhitta/biome-config/api-app` variant — the rules listed in ADR-0011's table. Apply to `apps/api/biome.json`. Update ADR-0011 status from `Proposed` → `Accepted`. Spec-validator inheritance check updated to expect `@rhitta/biome-config/api-app` for `apps/api`.

That's 13 sequential tasks. Reviewer dispatches optional (per Leo's Phase 1 directive, the implementer self-review + `pnpm validate` gate is sufficient unless a task is unusually risky).

---

## Acceptance criteria

Phase 2a is done when ALL of these pass on a clean machine:

1. `pnpm install --frozen-lockfile` succeeds.
2. `pnpm typecheck` passes for every workspace including `apps/api`.
3. `pnpm lint` passes (including the new `@rhitta/biome-config/api-app` ban rules from task 13).
4. `pnpm validate` runs the structure validator with all 9 checks (8 existing + 1 new module-structure check), reports `[rhitta:structure] OK`.
5. `pnpm -r build` builds `apps/api` (Encore.ts produces a deployable artifact).
6. `pnpm -r test` runs Vitest across `apps/api`; all tests pass; coverage is generated (not enforced).
7. `pnpm --filter @rhitta/api dev` starts the local Encore dev server; `POST /notes` (auth-gated) creates a note round-tripping through Postgres; `GET /notes` lists them; `POST /agent-runs` calls Claude and returns the result.
8. ADRs 0015–0018 are `Accepted`; ADR-0011 is `Accepted` (with the implementation now in place); ADR index updated.
9. CONTEXT.md vocab now includes Use-case, Reference resource, Agent run, Domain error, Event publisher, Migration.
10. Better Auth migration and notes migration both apply cleanly against a fresh Postgres.
11. `.env.example` documents every runtime env var.
12. CI is green on the Phase 2a PR.
13. Dockerfile builds; `docker run` boots the service against env-configured Postgres.

---

## What Phase 2a does NOT include

- `apps/web` and `apps/mobile` — Phase 2b and 2c.
- Real components in `@rhitta/design-system-web` / `@rhitta/design-system-mobile` — still empty-but-structured after Phase 2a.
- Async agent runs with state machine + Pub/Sub workers — sync HTTP only.
- Pub/Sub subscribers — only the publisher half ships.
- WebSocket / SSE / Encore streaming for realtime — Phase 2b/2c.
- OAuth providers configured — only the scaffold wired.
- Background jobs / cron — not in scope.
- Multi-tenancy primitives — not in scope.
- `create-rhitta` CLI or generators — Phase 3.
- Storybook — out of scope.
- Publishing `@rhitta/*` to npm — post-validation milestone (per Phase 0 handoff).

If you find yourself doing any of the above, stop.

---

## Working principles for the next session

- **Verify versions at runtime.** Encore.ts, Drizzle, Better Auth, Resend SDK, Anthropic SDK, Testcontainers — all confirmed via `npm view <pkg> version` before pinning.
- **Conventional commits per task.** Suggested scopes (matches the 13-task list):
  - `feat(contracts): add notes/auth/agent-runs domains`
  - `feat(api): workspace skeleton`
  - `feat(api): lib (errors, error-mapper, db, pub-sub, auth-gate, composeRoot)`
  - `feat(api): auth module with Better Auth integration`
  - `feat(api): notes module domain + application + in-memory infra`
  - `feat(api): notes module postgres repository + migrations`
  - `feat(api): notes module http endpoints + integration tests`
  - `feat(api): external adapters (resend, s3, in-memory)`
  - `feat(api): agent-runs module with Anthropic adapter`
  - `feat(api): composeRoot wiring + .env.example`
  - `feat(api): Dockerfile + deploy hardening`
  - `feat(structure-validator): module structure check for apps/api`
  - `feat(biome-config): api-app variant with ADR-0011 ban rules`
- **One PR worth of work** titled `feat(api): Phase 2a — apps/api with notes + agent-runs reference modules`.
- **Pre-commit hooks must continue to pass** at every commit. If a commit would break this, split or reorder.
- **Don't ask the user mid-session for clarification on decisions in this doc.** Document micro-choices in a new ADR (0019+) or in the handoff if they're broad enough.

---

## Suggested skills for the next session

- Standard tools (Read, Edit, Write, Bash).
- `verify` skill is useful at the end (smoke-test the API in a fresh shell).
- `superpowers:subagent-driven-development` is the recommended execution skill, mirroring Phase 1's process: dispatch implementer per task, skip the formal spec + code review subagents (per Leo's preference from Phase 1), rely on implementer self-review + `pnpm validate` gate.
- No grilling needed — the 18 ADRs cover the decision space.

---

## After Phase 2a

- **Phase 2b** — `apps/web` (TanStack Start, design system primitives populating `@rhitta/design-system-web`, reference page consuming `/notes`, TanStack Form integration, realtime hook factory for `NoteCreated`).
- **Phase 2c** — `apps/mobile` (Ignite scaffold + post-install overlay, design system mobile primitives, reference screen, mobile auth flow via Better Auth's mobile pattern).
- **Phase 3** — `create-rhitta` CLI, extended structure-validator (module + import boundary + naming), generators (`gen:module`, `gen:resource`, `gen:agent`).

Each phase = its own session with its own handoff doc.

---

## Validation milestone (unchanged)

After Phase 2c, Leo's wife's mobile app rewrite begins. Whatever breaks during that rewrite gets fixed in a Rhitta v0.1 release before EmberForge's design system migration starts. Rhitta does not publish to npm before this milestone.

---

End of Phase 2a handoff.
