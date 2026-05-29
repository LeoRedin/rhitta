# Rhitta

> Named after Escanor's Divine Axe from *Seven Deadly Sins* — a tool only the worthy can wield.

Rhitta is an opinionated monorepo boilerplate for shipping production-quality **API + web + mobile** apps. Its defining trait: **machine-enforced conventions that make architectural deviation visibly wrong** — especially for AI agents writing code in the repo. The stack is locked, the folder structure is locked, the patterns are locked. You rise to meet the standard; you don't negotiate it.

**Status:** alpha. v0 is **feature-complete** — all three apps, the shared packages, the structure validator, and the `create-rhitta` scaffolder ship and pass the gate. Not yet published to npm (see [Scaffolding a new project](#scaffolding-a-new-project)).

---

## Table of contents

- [What you get](#what-you-get)
- [The locked stack](#the-locked-stack)
- [Requirements](#requirements)
- [Working in this repo](#working-in-this-repo)
- [Scaffolding a new project](#scaffolding-a-new-project)
- [Repository layout](#repository-layout)
- [Conventions & enforcement](#conventions--enforcement)
- [Testing](#testing)
- [Versioning & releases](#versioning--releases)
- [Roadmap](#roadmap)
- [License](#license)

---

## What you get

A single pnpm workspace containing three production-shaped apps wired to shared, dual-themed packages:

| App | What it is |
|-----|------------|
| **`apps/api`** | Encore.ts service — hexagonal modules (`notes`, `auth`, `agent-runs`), Postgres via Drizzle repositories, Better Auth (magic link + email/password), typed domain errors mapped centrally, Pub/Sub events, Anthropic agent adapter. |
| **`apps/web`** | TanStack Start **SSR** client — Encore-generated API client, TanStack Query (server state) + Zustand (UI), TanStack Form via `createZodForm`, single auth gate, centralized realtime hook factory, Radix Primitives + Tailwind v4. |
| **`apps/mobile`** | Expo / React Native app — Expo Router (single auth gate), Zustand, Better Auth + SecureStore + magic-link deep linking, design-system primitives via Ignite's themed factory, same realtime hook shape as web. |

Shared across them: `@rhitta/contracts` (Zod schemas + inferred types — the single source of cross-stack truth), `@rhitta/design-tokens` (two-layer primitive + semantic tokens, light + dark from day one), `@rhitta/design-system-web` / `@rhitta/design-system-mobile`, and the locked `@rhitta/tsconfig` + `@rhitta/biome-config`.

The reference resource is **Note** (user-owned CRUD with branded ids, soft delete, pagination) — the worked example of the full hexagonal + module-DI stack, mirrored end-to-end across api → web → mobile, plus an agent-run demo.

---

## The locked stack

- **Package manager:** pnpm workspaces (no Nx/Turborepo for v0).
- **Language:** TypeScript, strict everywhere, `Bundler` module resolution.
- **Lint/format:** Biome (no ESLint, no Prettier).
- **API:** Encore.ts + Postgres + Drizzle, shipped as Docker.
- **Web:** TanStack Start (SSR-first), Radix Primitives, Tailwind v4.
- **Mobile:** Expo + Expo Router (Ignite-scaffolded base, Rhitta-overlaid).
- **Validation:** Zod only, via `@rhitta/contracts`.
- **Forms:** TanStack Form (web + mobile).
- **State:** TanStack Query (server) + Zustand (UI).
- **Auth:** Better Auth.
- **Commits:** Conventional Commits (commitlint + lefthook).
- **Versioning:** Changesets, fixed mode for `@rhitta/*`.

Every external concern (auth, email, storage, payments, AI, notifications) sits behind a typed **port**; default **adapters** ship. Swapping a provider means a new adapter, never restructuring the app. See [`docs/adr/`](./docs/adr/) — 27 ADRs lock these decisions.

---

## Requirements

- **Node `22.22.3`** (pinned in `.nvmrc`)
- **pnpm `10.14.0`** (pinned in `package.json` `packageManager`)

Use whichever version manager you like — `nvm use` reads `.nvmrc`; `corepack enable` activates the pinned pnpm; asdf users get a `.tool-versions` generated into scaffolded projects automatically.

---

## Working in this repo

```bash
nvm use            # Node 22.22.3
corepack enable    # pinned pnpm
pnpm install
pnpm build         # build shared packages (they export from dist/)
pnpm validate      # lint + per-package validate (typecheck + tests) + structure validation
```

> Run `pnpm build` before `pnpm validate` on a fresh clone: `@rhitta/*` packages export from `dist/`, so the shared packages must be compiled before the apps typecheck.

Scripts (root `package.json`):

| Command | Does |
|---------|------|
| `pnpm build` | Build the shared packages (`pnpm -r --filter './packages/**' build`). |
| `pnpm typecheck` | Type-check every workspace. |
| `pnpm lint` | Biome lint + format check. |
| `pnpm format` | Biome auto-format. |
| `pnpm validate` | Per-package `validate` + structure validation — the full local gate. |
| `pnpm structure:validate` | Run the structure validator only. |
| `pnpm changeset` | Author a changeset. |

Pre-commit hooks (lefthook) run Biome + the structure validator + typecheck; pre-push runs the full `validate`. Do not skip hooks (`--no-verify`).

---

## Scaffolding a new project

`create-rhitta` ([`tools/create-rhitta`](./tools/create-rhitta)) is the public, unscoped scaffolder. It **vendors the whole monorepo** (all three apps + packages + tools) into a new project, keeps the `@rhitta/*` namespace, rewrites your project identifiers, strips Rhitta-internal files, regenerates the README, and runs install + build so the result validates out of the box.

> **Not yet published to npm.** Publishing is gated on the v0 validation milestone. Until then, run it from a local checkout:

```bash
# build the CLI once
pnpm --filter create-rhitta build

# scaffold from this checkout
node tools/create-rhitta/dist/index.js my-app \
  --name "My App" \
  --bundle-id com.myorg.myapp \
  --from .
```

After publish, the canonical form will be:

```bash
npm create rhitta@latest my-app      # or: pnpm create rhitta my-app / npx create-rhitta my-app
```

Interactive when run without flags; otherwise:

| Flag | Meaning |
|------|---------|
| `<dir>` | Target directory (positional). Prompted if omitted. |
| `--name <s>` | App display name. |
| `--bundle-id <s>` | Mobile reverse-DNS bundle id (e.g. `com.myorg.myapp`). |
| `--from <path>` | Vendor from a local Rhitta checkout (used today, pre-publish). |
| `--ref <git-ref>` | GitHub ref/tag to vendor from (the published path). |
| `--no-install` | Skip dependency install (and the package build). |
| `--no-git` | Skip `git init`. |

What it rewrites (only these — `@rhitta/*` package names are kept): root package name, Encore app id (`encore.app` + both `gen-api-client.sh` `APP_ID`s), mobile `app.json` name/slug/scheme/bundle id, the mobile Maestro app id, and `apps/api/.env.example`'s bucket. It also writes a `.tool-versions` (Node from `.nvmrc`, pnpm from `packageManager`) so the new directory works without version-manager setup.

After scaffolding:

```bash
cd my-app
pnpm validate                              # green out of the box
pnpm --filter @rhitta/mobile prebuild:clean  # materialize ios/android (managed-workflow mobile)
```

---

## Repository layout

```
apps/
  api/        Encore.ts service (modules: notes, auth, agent-runs)
  web/        TanStack Start SSR client
  mobile/     Expo / React Native app
packages/
  tsconfig/             four tsconfig variants (asymmetric JSX)
  biome-config/         base + react + per-app lint variants
  design-tokens/        primitive + semantic tokens, light + dark
  contracts/            Zod schemas + inferred types
  design-system-web/    Radix + Tailwind primitives
  design-system-mobile/ Ignite-themed primitives
tools/
  structure-validator/  enforces repo conventions (nine checks)
  create-rhitta/         the published scaffolder (unscoped)
docs/
  adr/        27 Architecture Decision Records
CONTEXT.md    the glossary (canonical domain terms)
AGENTS.md     the operating manual (conventions; read first)
```

Where new code goes is fixed — see the decision table in [`AGENTS.md`](./AGENTS.md).

---

## Conventions & enforcement

The canonical operating manual is [`AGENTS.md`](./AGENTS.md); the domain glossary is [`CONTEXT.md`](./CONTEXT.md); decisions live in [`docs/adr/`](./docs/adr/). Read those before opening a PR. Highlights, all machine-enforced:

- **One way to do everything.** Deviation requires an ADR.
- **Hexagonal architecture.** Every external concern is a port; adapters live in `infra/`.
- **DB access through repositories only** (`infra/postgres-*-repository.ts`).
- **Validation through Zod only**, shared via `@rhitta/contracts`.
- **Typed domain errors**, mapped to HTTP status in one central place.
- **One auth gate per platform**; realtime only through the centralized hook factory.
- **No `as any` / `@ts-ignore` / `@ts-expect-error`** without a ticket reference.

The **structure validator** (`tools/structure-validator`, nine checks) enforces top-level shape, workspace naming/shape, tsconfig + Biome inheritance, package naming, workspace deps, API module shape, and route conventions — failing the build with the relevant ADR reference. Biome carries the architectural import bans per app variant.

---

## Testing

Platform-correct test runners (see [ADR-0026](./docs/adr/0026-platform-correct-test-runners.md)):

- **`apps/web`, `apps/api`, `packages/*`** → **Vitest**.
- **`apps/mobile`** → **jest-expo** (React Native is a different problem; `jest-expo` is the ecosystem-correct runner).

Each package's `validate` runs its typecheck + tests; `pnpm validate` runs them all plus the structure validator. End-to-end suites (Playwright for web, Maestro for mobile) are on the roadmap.

---

## Versioning & releases

Changesets in **fixed mode** for `@rhitta/*` — every `@rhitta/*` package shares one version ([ADR-0010](./docs/adr/0010-fixed-versioning.md)). `create-rhitta` is published **independently** (consumers run it before any `@rhitta/*` exists; [ADR-0027](./docs/adr/0027-create-rhitta-vendored-scaffold.md)). The release workflow is tag-gated and inert until the npm scope + `NPM_TOKEN` are configured.

---

## Roadmap

- ✅ **Phases 0–2** — tooling skeleton, shared packages, all three apps.
- ✅ **Phase 3 (partial)** — `create-rhitta` vendored scaffolder.
- ⏳ **v0 validation milestone** — a real app is built on Rhitta v0; whatever breaks is fixed into a v0.1 before publishing to npm.
- ⏳ **Rest of Phase 3** — generators (`gen:module` / `gen:resource` / `gen:agent` / `gen:primitive`), AST-level structure checks (cross-module import / deep-import / naming), and Playwright + Maestro e2e.

---

## License

[MIT](./LICENSE).
