# Architecture Decision Records

ADRs capture decisions that shape Rhitta. Each is short by design — read in under two minutes, link from PRs and code.

## Conventions

- Numbered sequentially. Never renumber; supersede with a new ADR if needed.
- Status is one of: `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
- ADR-0005 retains its number for continuity with the audited EmberForge codebase.

## Index

| # | Title | One-liner |
|---|-------|-----------|
| [0001](./0001-pnpm-workspaces.md) | pnpm workspaces | Plain pnpm workspaces over Nx/Turborepo for v0 |
| [0002](./0002-hexagonal-architecture.md) | Hexagonal architecture | Ports and adapters for every external concern |
| [0003](./0003-module-di-pattern.md) | Module DI pattern | `composeRoot` / `registerXModule` per feature module |
| [0004](./0004-zod-as-sole-validator.md) | Zod as sole validator | One validation system, shared via `@rhitta/contracts` |
| [0005](./0005-db-seam-through-repos.md) | DB seam through repos | All DB access funnels through repository files |
| [0006](./0006-three-package-design-system-split.md) | Three-package design system | tokens + design-system-web + design-system-mobile |
| [0007](./0007-tanstack-form-everywhere.md) | TanStack Form everywhere | One form library on web and mobile |
| [0008](./0008-ignite-themed-approach-mobile.md) | Ignite-themed mobile styling | No NativeWind on mobile |
| [0009](./0009-encore-docker-default.md) | Encore.ts + Docker default | API runs on Encore.ts, ships as Docker |
| [0010](./0010-fixed-versioning.md) | Fixed versioning | All `@rhitta/*` packages share one version |
| [0011](./0011-lint-enforced-architectural-boundaries.md) | Lint-enforced architectural boundaries | `@rhitta/biome-config/api-app` bans direct DB/vendor SDK imports outside `infra/` / `adapters/` |
| [0012](./0012-two-layer-tokens-dual-theme.md) | Two-layer tokens + dual theme | Primitive + semantic layers, light + dark from day 1 |
| [0013](./0013-contracts-package-shape.md) | `@rhitta/contracts` package shape | Per-domain folders + per-subpath exports + three-shapes-per-entity boundary |
| [0014](./0014-asymmetric-jsx-tsconfig.md) | Asymmetric JSX transform | `jsx: preserve` on web, `jsx: react-jsx` on mobile |
| [0015](./0015-single-encore-service-multi-module.md) | Single Encore service + multi-module | One `api` service; modules are the only boundary in v0 |
| [0016](./0016-drizzle-orm-canonical-repository.md) | Drizzle ORM | Canonical repository tool with SQL-first migrations |
| [0017](./0017-belt-and-braces-validation.md) | Belt-and-braces validation | Encore TS-derived wire validation + explicit Zod runtime parse |
| [0018](./0018-domain-errors-central-mapper.md) | Domain errors + central mapper | Typed `DomainError` hierarchy mapped to HTTP status in one file |

## Authoring a new ADR

1. Take the next free number (`ls docs/adr` → highest `+ 1`).
2. Copy the template below.
3. Keep the four sections short — bullets are fine.
4. Link from the PR that introduces the decision and from any code the ADR governs.

```markdown
# ADR NNNN: Title

## Status
Proposed | Accepted | Superseded by NNNN | Deprecated

## Context
What problem this solves, what alternatives were considered.

## Decision
The decision in one paragraph.

## Consequences
What this enables and what it costs.
```
