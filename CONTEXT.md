# Rhitta Glossary

Canonical terms used across this monorepo. When in doubt, this file wins over conversational shorthand.

## Phase

A discrete shipment of Rhitta capability, defined by its own handoff document and merged as one PR. Phases are sequential and non-overlapping. Phase 0 = skeleton (shipped 2026-05-27); Phase 1 = shared packages; Phase 2 = apps; Phase 3 = CLI + generators.

## Workspace

A pnpm-managed package directory under `apps/*`, `packages/*`, or `tools/*`. Every workspace has a `package.json` named `@rhitta/<slug>` and either ships code, ships config, or builds tools internal to the repo.

## Shared package

A workspace under `packages/*` that is published (or will be published) to npm under the `@rhitta` scope. Consumed by `apps/*` and by scaffolded downstream projects. The four real Phase 1 shared packages are `@rhitta/tsconfig`, `@rhitta/biome-config`, `@rhitta/design-tokens`, `@rhitta/contracts`. Distinct from "internal tool" — see below.

## Internal tool

A workspace under `tools/*` that is **never published**. Consumed only within this repo or via copy-at-scaffold into downstream projects. Examples: `tools/structure-validator`, future `tools/create-rhitta`, future `tools/generators`. Excluded from changesets `fixed[]` and listed in changesets `ignore[]`.

## Module (API)

A self-contained feature folder under `apps/api/src/modules/<feature>/` with exactly four subfolders: `domain/`, `application/`, `infra/`, `http/`. Composed at the root via `composeRoot` and per-module `registerXModule(deps)` factories. See ADR-0003. Distinct from "module" in the TypeScript / npm sense.

## Port

A typed interface that the application core depends on for an external concern (DB, auth, payments, email, storage, analytics, AI providers, notifications). Lives in `domain/` or `application/` depending on the concern. See ADR-0002.

## Adapter

A concrete implementation of a port for a specific provider. Lives exclusively in `infra/`. Swapping providers means writing a new adapter, never restructuring the app. See ADR-0002.

## Repository

A specialized adapter for database access. Lives in `infra/postgres-<entity>-repository.ts`. **The only place** in the codebase allowed to import database drivers or query builders. See ADR-0005.

## Contract

A Zod schema + its inferred TypeScript type, exported from `@rhitta/contracts`. Used at every system boundary (HTTP request/response on the API, form schemas on web/mobile). Single source of truth for cross-stack types. See ADR-0004.

## Wire schema

A specific kind of contract: the shape of an entity as it crosses an external boundary (HTTP, Pub/Sub event, agent run input/output, webhook). Distinct from the "domain class" (behavioral, lives in `domain/`) and the "persistence row" (database column shape, lives near the repository). Three shapes per entity, three mappers between them. See ADR-0013.

## Primitive token

A raw design value (color hex, pixel spacing, font family string, ms duration) exported from `@rhitta/design-tokens`. Components **never** read primitives directly. Components read semantic tokens (below). Rebrand = swap primitive values. See ADR-0012.

## Semantic token

An alias in `@rhitta/design-tokens` that points at a primitive (e.g., `semantic.bg.surface` → `colors.neutral[50]` in light theme, `colors.neutral[900]` in dark). Components read **only** semantic tokens. Restyling for accessibility / new themes = swap semantic aliases. See ADR-0012.

## Theme

A complete mapping of every semantic token to a primitive value. Rhitta ships two themes from day 1: `light` and `dark`. On web, themes resolve via CSS variable scope (`:root` for light, `[data-theme="dark"]` for dark). On mobile, themes resolve via Ignite's themed factory hook. See ADR-0012.

## tsconfig variant

One of four configs exported by `@rhitta/tsconfig`: `base.json` (universal strict defaults), `node.json` (server / CLI / tools), `web.json` (Vite-bundled browser code, `jsx: preserve`), `mobile.json` (Metro-bundled React Native code, `jsx: react-jsx`). JSX strategy is intentionally asymmetric — see ADR-0014.

## Use-case

An application-layer object orchestrating a single domain operation (e.g., `CreateNoteUseCase`, `RunAgentUseCase`). Lives in `apps/api/src/modules/<feature>/application/`. Receives ports via DI; never imports vendor SDKs directly. Pure logic — no HTTP, no DB queries, no framework. One use-case per intent. See ADR-0003.

## Reference resource

The canonical example entity that demonstrates the full hexagonal + module-DI stack inside `apps/api`. For Phase 2a, the reference resource is **Note** (user-owned, simple CRUD with branded `NoteId`, soft delete, pagination). Used as the worked example in all module-pattern documentation. Distinct from any production entity in a downstream Rhitta consumer.

## Agent run

A single invocation of an AI agent via the `AgentProvider` port. Phase 2a ships sync HTTP only (`POST /agent-runs { input } → { output }`). Async runs with a state machine (queued/running/done) and Pub/Sub-driven workers are a future extension; the `AgentProvider` interface is shaped to permit both.

## Domain error

A typed error class extending `DomainError`. Concrete subclasses: `NotFoundError`, `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `RateLimitedError`. Use-cases throw these; the central mapper in `apps/api/src/lib/error-mapper.ts` translates each to Encore's `APIError` with the right HTTP status. Handlers never set status codes manually. See ADR-0018.

## Event publisher

The port through which domain events leave a use-case. Lives in `apps/api/src/lib/pub-sub.ts`. Default adapter wraps Encore.ts's native Pub/Sub. Phase 2a ships one event (`NoteCreated`) with no subscribers — demonstrates the seam without forcing event-handler infrastructure.

## Migration

A versioned SQL file under `apps/api/src/lib/drizzle/` describing one forward-only schema change. Authored via Drizzle Kit. Applied at app startup (development) or via a CI step (production). Repositories must never run DDL outside migration files. See ADR-0016.

## SSR (server-side rendering)

The render mode for `apps/web`. The route tree resolves on the Node server first; the rendered HTML ships to the browser with hydration data inlined. Distinct from SPA mode (client-only render after a JS bootstrap). Rhitta web is SSR-first because most product apps have auth-gated routes — server-side rendering avoids the "flash of unauthenticated content" failure mode. See ADR-0019.

## Encore client SDK

A typed TypeScript client generated by Encore.ts from `apps/api`'s endpoint declarations. Lives at `apps/web/src/lib/api-client/` (regenerated by a build script). All web → API calls go through this client; no raw `fetch()` to the API surface anywhere else. Mirrored on mobile in Phase 2c. See ADR-0020.

## Realtime hook factory

A single React hook factory at `apps/web/src/lib/realtime/use-realtime-subscription.ts` that abstracts the chosen transport (Encore streaming endpoint or SSE) from consumers. Components never instantiate `WebSocket`, `EventSource`, or any raw transport — they call `useRealtimeSubscription(topic, callback)`. Enforced by `@rhitta/biome-config/web-app`'s `noRestrictedImports` allowlist. See ADR-0021.

## Auth gate (web)

The single TanStack Router location where unauthenticated requests are caught and redirected. Lives at `apps/web/src/routes/_authenticated/route.tsx` as a `beforeLoad` hook that reads the Better Auth session. Pages and components never check auth themselves. See AGENTS.md rule 10 + ADR-0019 (SSR session resolution).

## Auth gate (mobile)

The single Expo Router location where unauthenticated requests are caught and redirected. Lives at `apps/mobile/app/_authenticated/_layout.tsx`. Uses Better Auth's React client + Expo SecureStore for the session token. Screens never check auth themselves. See AGENTS.md rule 10 + ADR-0023.

## Rhitta overlay (mobile)

The post-install script at `apps/mobile/scripts/rhitta-overlay.sh` that patches Ignite's generated files to match Rhitta conventions: Expo Router (ADR-0023), Zustand (ADR-0024), the Encore client, design-tokens-driven Ignite themed factory, and the `@rhitta/biome-config/mobile-app` lint variant. Idempotent. Re-run after Ignite upgrades. See ADR-0025.
