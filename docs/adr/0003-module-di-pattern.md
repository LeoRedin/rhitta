# ADR 0003: Module DI pattern (composeRoot / registerXModule)

## Status
Accepted

## Context
Rhitta needs a single, mandatory shape for how features are organized inside the API. Without a mandatory shape, ten features become ten architectures. With AI agents writing code, the divergence rate is even higher.

The pattern used in the audited EmberForge codebase has proven robust: each feature is a self-contained module with `domain/`, `application/`, `infra/`, and `http/` folders. Composition happens via `composeRoot` (the top-level wiring) and per-module `registerXModule(deps)` factories.

## Decision
Every API feature is a module under `apps/api/src/modules/<feature>/` with exactly these subfolders:
- `domain/` — entities, value objects, domain errors. No framework, no I/O.
- `application/` — use-cases. Pure functions / classes accepting ports as dependencies.
- `infra/` — adapter implementations (repositories, external clients).
- `http/` — Encore.ts service definitions, request/response mapping (uses `@rhitta/contracts` Zod schemas).

Each module exports `registerXModule({ deps })` which returns the module's public surface. `composeRoot` wires modules together. **No cross-module deep imports** — modules talk through their `registerXModule` returns only.

The structure validator (extended in later phases) enforces this layout.

## Consequences
- Every feature is reasoned about in isolation. Onboarding a new module — by a human or an agent — is mechanical.
- The compose root is the single place to look up "who depends on what."
- Cost: more files per feature than a flat layout. Worth it for the navigation guarantees.
- Continuity with EmberForge means future migrations between the two repos are syntactically familiar.
