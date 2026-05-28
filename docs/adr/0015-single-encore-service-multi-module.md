# ADR 0015: Single Encore service with multiple modules

## Status
Accepted

## Context
Encore.ts supports two deployment shapes: a single service exposing many endpoints, or multiple services each with their own deploy and scaling characteristics. Most Encore.ts examples and the framework's documentation push the multi-service shape — it's where Encore's primitives (service-to-service RPC, Pub/Sub topics, per-service scaling) shine.

Rhitta already has a strong module boundary through ADR-0003's module DI pattern (`composeRoot` + per-module `registerXModule(deps)`). Layering Encore's service boundary on top of that would create **two competing boundaries**:
- The module boundary (architectural — what code is allowed to talk to what)
- The service boundary (deployment — what gets shipped together)

Two boundaries means two answers to "should this code live together?" — and the answers diverge as soon as a single feature needs to be co-deployed across modules (e.g., a `notes` HTTP endpoint that triggers an `agent-runs` execution).

Alternatives considered:
- **Multi-service from day 1.** Each module = an Encore service. Pure but premature; nothing in Phase 2a benefits from independent scaling, independent secrets, or inter-service auth. Cost: 4–5 services for the v0 surface, each with its own boilerplate.
- **Hybrid (some modules co-located, some separate).** Worst of both worlds — engineers have to ask "is this module its own service?" for every new module.
- **Single service, multiple modules** *(chosen)*. One Encore service called `api`. All modules live inside it. The module boundary is the only boundary engineers reason about. Pub/Sub topics still cross modules cleanly — they just don't cross services in v0.

## Decision
`apps/api` is **one Encore.ts service** named `api`. The Encore service manifest (`apps/api/src/encore.app.ts` or `apps/api/encore.app`) declares this single service. All modules (`apps/api/src/modules/<feature>/`) compose into it via `composeRoot`.

If a module ever needs independent scaling, independent secrets, or inter-service isolation, splitting it into its own Encore service is a future migration documented in a superseding ADR. Until then, the module boundary is sufficient.

## Consequences
- One Docker image. One deploy. One Encore project. One Better Auth instance. One Postgres connection pool.
- Local dev is `pnpm --filter @rhitta/api dev` — single process.
- `composeRoot` is the single source of truth for "what's in this service."
- Pub/Sub events cross modules cleanly via the `EventPublisher` port (ADR-0018-adjacent); they just stay in one process for v0.
- Future split is reversible — Encore makes it; the module boundary already maps cleanly onto a future service boundary.
- Cost: no independent module scaling in v0. Accepted — Rhitta is shipped for projects that don't have that problem yet.
