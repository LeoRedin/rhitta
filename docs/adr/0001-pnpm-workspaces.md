# ADR 0001: pnpm workspaces (no Nx, no Turborepo for v0)

## Status
Accepted

## Context
Rhitta is a monorepo by definition (API + web + mobile + shared packages + tooling). The choice of monorepo manager affects install speed, hoisting behavior, task orchestration, and the cognitive load on agents reading the repo.

Alternatives considered:
- **npm/yarn workspaces** — slower, looser dependency isolation, no built-in content-addressable store.
- **Nx** — powerful task graph, generators, caching — but heavy config and a meta-build layer that hides what's happening. AI agents reading the repo would face an extra abstraction.
- **Turborepo** — lighter than Nx, good remote cache story — but still an additional layer on top of the package manager, and `turbo.json` becomes another spec to learn.
- **Plain pnpm workspaces** — strict-by-default symlinked node_modules, content-addressable store (fastest installs), workspace protocol, native `pnpm -r` orchestration with `--filter` and `--parallel`.

## Decision
Use **plain pnpm workspaces**. No Nx, no Turborepo. Task orchestration uses `pnpm -r` and `pnpm --filter`. If task-graph caching becomes painful in later phases, revisit — but ship v0 with the minimum that works.

## Consequences
- Faster installs and stricter dep isolation than npm/yarn.
- One fewer abstraction for agents to learn — `package.json` scripts plus `pnpm -r` is the whole story.
- No remote build cache out of the box. If CI runtime balloons in a later phase, we add Turborepo or Nx, document the migration in a follow-up ADR.
- All workspaces use the `@rhitta/*` scope and the `workspace:*` protocol for internal deps.
