# Rhitta

> Named after Escanor's Divine Axe from *Seven Deadly Sins* — a tool only the worthy can wield.

Rhitta is an opinionated monorepo boilerplate for shipping production-quality API + web + mobile apps. Its defining trait: **machine-enforced conventions that make architectural deviation visibly wrong**, especially for AI agents writing code in the repo.

**Status:** alpha. Phase 0 (skeleton only) — apps and shared packages land in later phases.

---

## For agents and humans alike

The canonical operating manual lives in [`AGENTS.md`](./AGENTS.md). Architectural decisions live in [`docs/adr/`](./docs/adr/). Read those before opening a PR.

---

## Local setup

Requires Node 22.11.0 (`.nvmrc`) and pnpm 10.x.

```bash
nvm use            # picks up Node 22.11.0
corepack enable    # uses the pinned pnpm in package.json
pnpm install
pnpm validate      # lint + typecheck + structure validation
```

If everything passes, the skeleton is healthy.

---

## What's in v0

- pnpm workspaces (apps, packages, tools)
- TypeScript strict everywhere, Bundler resolution
- Biome for lint + format (no ESLint, no Prettier)
- Vitest configured later (deferred — no tests in Phase 0)
- Conventional Commits via commitlint + lefthook
- Changesets in fixed-versioning mode for `@rhitta/*`
- Structure validator (`tools/structure-validator`) that enforces repo conventions at build time
- Ten foundational ADRs

---

## What's coming

- **Phase 1** — Shared packages (`@rhitta/tsconfig`, `@rhitta/biome-config`, `@rhitta/design-tokens`, `@rhitta/contracts`, empty-but-structured design-system packages).
- **Phase 2** — `apps/api` (Encore.ts + Postgres + Better Auth), `apps/web` (TanStack Start), `apps/mobile` (Ignite).
- **Phase 3** — `create-rhitta` CLI, extended structure validator, generators.

---

## License

[MIT](./LICENSE).
