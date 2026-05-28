# ADR 0011: Lint-enforced architectural boundaries (forward-spec)

## Status
Accepted — Phase 2a implementation landed alongside this status flip; `@rhitta/biome-config/api-app` carries the rules; allowlist scoping via `overrides.includes` matches the table.

## Context
Several Rhitta architectural rules — "DB clients only inside repositories," "vendor SDKs only inside adapters," "realtime transports only inside the centralized hook" — are most usefully enforced at lint time. Biome 2.x's `noRestrictedImports` rule can express these as `import X is forbidden unless the file matches glob Y`.

The catch: the file globs that define *where* an import is permitted (e.g., `apps/api/src/modules/*/infra/postgres-*-repository.ts`) don't exist yet. Phase 1 has no apps and no modules. Encoding the rules now with empty allowlists would actively mislead — a future agent reads `noRestrictedImports.paths: []` and concludes "no restriction."

Two alternatives considered:
1. **Defer the bans entirely with no forward record** — risk: Phase 2 agents and engineers rediscover the rules from scratch and may converge on a weaker set.
2. **Scaffold empty allowlists in `@rhitta/biome-config` now** — risk: misleading dormancy. Worse than no record.
3. **Document the intended bans in an ADR as `Proposed`, implement in Phase 2** — preserves intent without misleading.

## Decision
Adopt option 3: ship `@rhitta/biome-config` in Phase 1 **without** the architectural ban rules. Capture the *intended* rules here, as `Proposed`. Phase 2a (when `apps/api` lands) implements the API-side bans; Phase 2b (web) and Phase 2c (mobile) implement their respective bans. When implemented, this ADR's status flips to `Accepted` and a child ADR per ban may be created if needed.

The Phase 2 implementation will encode, at minimum, the following rules via Biome's `noRestrictedImports` plus `overrides` for path scoping:

| Banned import | Allowed only inside | Justification |
|---------------|---------------------|---------------|
| `pg`, `postgres`, any direct DB driver | `apps/api/src/modules/*/infra/postgres-*-repository.ts` | ADR-0005 |
| `@supabase/supabase-js` admin client | `apps/api/src/modules/auth/infra/**` (TBD) | Hexagonal boundary (ADR-0002) |
| `supabase.channel(...)` / raw realtime transports | `apps/web/src/lib/realtime/**` (centralized hook factory) | AGENTS.md rule 9 |
| `stripe`, `@aws-sdk/*`, vendor SDKs generally | corresponding `infra/<vendor>-*.ts` adapters | ADR-0002 |
| `useState` for canonically server-derived data | banned everywhere (warn only; structurally hard to lint) | AGENTS.md rule 8 |
| Cross-module deep imports (`apps/api/src/modules/X/...` from `modules/Y/`) | only via each module's `registerXModule` public surface | ADR-0003 |

A separate set of structural checks (folder shape, `domain/application/infra/http` layout) belongs to `tools/structure-validator` per ADR-0003, not to Biome. Both layers complement each other; do not double-track.

## Consequences
- Phase 1 ships `@rhitta/biome-config` as `base` + `react`, no ban rules. Apps and packages adopt it cleanly.
- The intent is durable and PR-traceable. Phase 2 implementers either honor this list or write a superseding ADR.
- Cost: this ADR is itself speculative until Phase 2 lands. Marked `Proposed` to signal that.
- When Phase 2 implements, a follow-up commit updates this ADR's status and links to the actual Biome config diffs.

## Implementation status (Phase 2a)

`packages/biome-config/api-app.json` carries the API-side ban rules. `apps/api/biome.json` extends both `@rhitta/biome-config/base` and `@rhitta/biome-config/api-app` — the explicit dual-extends is a Biome 2.4.16 workaround for transitive `extends` not propagating the formatter config.

Active bans (each emits `lint/style/noRestrictedImports` errors at lint time):

| Banned import | Scope where allowed | Real consumers today |
|---------------|---------------------|----------------------|
| `pg` | `src/modules/*/infra/**`, `src/modules/*/__tests__/**`, `src/lib/db.ts`, `src/adapters/**`, `src/modules/auth/**` | `src/lib/db.ts` (the canonical DB seam per ADR-0005); `src/modules/notes/__tests__/postgres-note-repository.test.ts` (integration test) |
| `postgres` | same allowlist | none yet (preemptive — for the day we migrate off `pg` to `postgres.js`) |
| `@anthropic-ai/sdk` | adapter/infra allowlist | `src/modules/agent-runs/infra/anthropic-agent-adapter.ts` |
| `@aws-sdk/client-s3` | adapter/infra allowlist | `src/adapters/s3-storage-adapter.ts` |
| `resend` | adapter/infra allowlist | `src/adapters/resend-email-adapter.ts` |
| `better-auth` | `src/modules/auth/**` only | `src/modules/auth/infra/better-auth-adapter.ts`, `src/modules/auth/infra/better-auth-gate.ts` |
| `stripe` | adapter/infra allowlist | none yet (preemptive — billing module not built) |
| `@supabase/supabase-js` | adapter/infra allowlist | none anywhere in the repo (preemptive — Supabase isn't a Rhitta dependency in v0) |

Override scope clarifications vs. the original table:
- `src/lib/db.ts` is in the override allowlist because ADR-0005 designates it as "the one exception (the seam itself)" — it constructs the `pg.Pool` from Encore's managed `SQLDatabase` connection string.
- `src/modules/*/__tests__/**` is allowed because integration tests for `infra/` repositories need to wire their own driver to a Testcontainers Postgres.

Remaining Phase 2 rows (not yet enforced):
- `useState` for server-derived data — Phase 2b (apps/web); warn-only and structurally weak, so deferred.
- Cross-module deep imports — Phase 2a deferred to `tools/structure-validator` (per ADR-0003 the structural check belongs to the validator, not Biome).

`tools/structure-validator/src/checks/biome-inheritance.ts` enforces that `apps/api/biome.json` extends `@rhitta/biome-config/api-app` so the bans can't be silently dropped by switching variants.

## Implementation status (Phase 2b)

`packages/biome-config/web-app.json` carries the web-side ban rules. `apps/web/biome.json` (landing in Phase 2b Task 2) will extend `@rhitta/biome-config/base`, `@rhitta/biome-config/react`, and `@rhitta/biome-config/web-app` — the explicit triple-extends matches the Task 27 (api-app) precedent for working around Biome 2.4.16's formatter-propagation behaviour.

Active bans (each emits `lint/style/noRestrictedImports` errors at lint time):

| Banned import | Scope where allowed | Real consumers today |
|---------------|---------------------|----------------------|
| `@supabase/supabase-js` | `src/lib/realtime/**`, `src/lib/auth/**`, `src/lib/api-client/**`, `src/__tests__/**`, `**/__tests__/**` | none yet (preemptive — Supabase isn't a Rhitta dependency in v0) |
| `better-auth` | same allowlist | none on web yet (lands with auth routes in Phase 2b) |
| `better-auth/client` | same allowlist | none yet |
| `better-auth/react` | same allowlist | none yet (Phase 2b auth-client task) |

Statically un-enforceable bans (per ADR-0021) — discipline enforced by code review until a structure-validator AST check or custom Biome GritQL plugin lands in Phase 3:
- Bare `new WebSocket(...)` outside `src/lib/realtime/**`.
- Bare `new EventSource(...)` outside `src/lib/realtime/**`.

Biome's `noRestrictedImports` operates on module specifiers and cannot ban global constructors.

`tools/structure-validator/src/checks/biome-inheritance.ts` now also requires `apps/web/biome.json` to extend `@rhitta/biome-config/web-app` (vacuous until Phase 2b Task 2 lands `apps/web`).

## Implementation status (Phase 2b streaming)

`apps/api/src/modules/notes/http/stream.ts` ships an SSE streaming endpoint at `GET /events/notes` that subscribes to an in-process event bus (`apps/api/src/lib/event-bus.ts`) and re-emits `note-created` events filtered by `authorId === currentUserId`. Producers (currently the `POST /notes` handler) emit to both Encore's Pub/Sub topic and the local event bus, so the streaming layer stays decoupled from durable messaging. The bus is a plain EventEmitter — the intended Phase 3 upgrade path replaces it with a shared backplane (Redis pub/sub or Encore Cloud's managed pub/sub) while keeping the streaming endpoint's interface unchanged.
