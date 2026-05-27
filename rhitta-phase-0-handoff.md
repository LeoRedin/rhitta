# Rhitta — Phase 0 Skeleton Handoff

**Date:** 2026-05-27
**For:** A fresh Claude Code session in a brand-new empty directory
**Goal:** Build the Phase 0 skeleton of Rhitta — the agentic-AI-first opinionated boilerplate

---

## What Rhitta is

Rhitta is an opinionated monorepo boilerplate for shipping production-quality API + web + mobile apps. Its defining trait: **machine-enforced conventions that make architectural deviation visibly wrong, especially for AI agents writing code in the repo.** Named after Escanor's Divine Axe Rhitta from Seven Deadly Sins — a tool only the worthy can wield. The boilerplate sets the standard; you and your AI agents rise to meet it.

This handoff covers Phase 0: the empty monorepo skeleton, shared tooling foundation, and constraint enforcement layer. No apps yet. No packages yet beyond config. The output is a repo where `pnpm install` succeeds, `pnpm typecheck` runs, and the structure validator passes.

Phases 1–3 (shared packages, apps, CLI delivery) come in subsequent sessions.

---

## Locked architectural decisions

These are not up for debate in this session. They were settled in extensive prior discussion. If something seems ambiguous, follow these defaults rather than asking.

### Stack
- **Monorepo:** pnpm workspaces (no Nx, no Turborepo for v0)
- **Package manager:** pnpm 10.x (pin exact minor in `packageManager` field)
- **Node:** 22.11.0 pinned in `.nvmrc` and `engines` field
- **TypeScript:** strict everywhere, Bundler resolution
- **Linter/formatter:** Biome (latest stable). No ESLint, no Prettier.
- **Testing:** Vitest configured but tests are deferred to a later phase
- **Commits:** Conventional Commits enforced via commitlint + lefthook (NOT Husky — lefthook is faster and language-agnostic)
- **Versioning:** Changesets, fixed/locked mode (all `@rhitta/*` packages share one version)
- **License:** MIT

### Future packages (NOT created in Phase 0, but the skeleton must accommodate them)
- `apps/api/` — Encore.ts + Postgres (Neon default) + Better Auth, deployed as Docker
- `apps/web/` — TanStack Start + Router + Query + Form + Table, design system from `@rhitta/design-system-web`
- `apps/mobile/` — Ignite (no fork — post-install overlay applies Rhitta conventions), Ignite-themed approach (NOT NativeWind, NOT StyleSheet-with-inline-tokens), TanStack Form
- `packages/tsconfig/` — `@rhitta/tsconfig` — shared TS configs (base, node, web, mobile)
- `packages/biome-config/` — `@rhitta/biome-config` — shared Biome rules
- `packages/design-tokens/` — `@rhitta/design-tokens` — colors, typography, spacing, motion as both TS and CSS
- `packages/design-system-web/` — `@rhitta/design-system-web` — Radix-wrapped primitives + Tailwind v4
- `packages/design-system-mobile/` — `@rhitta/design-system-mobile` — Ignite-themed primitives mirroring web's API surface
- `packages/contracts/` — `@rhitta/contracts` — Zod schemas + inferred types, shared between API/web/mobile
- `tools/create-rhitta/` — the `npx create-rhitta` CLI (last phase)
- `tools/structure-validator/` — validates Rhitta conventions at build time
- `tools/generators/` — code generators (`gen:module`, `gen:resource`, `gen:agent`)

### Architectural patterns (foundational, encoded everywhere)
- **Hexagonal architecture (ports and adapters)** — every external concern (auth, payments, email, storage, analytics, notifications) hits the app through a typed interface. Default implementations ship in v0; swapping providers means implementing the adapter, never restructuring.
- **Module DI pattern** — copied from the audited EmberForge codebase's `composeRoot` / `registerXModule` pattern. Each feature is a self-contained module with `domain/`, `application/`, `infra/`, `http/` folders. The boilerplate enforces this structure rigidly.
- **DB seam through repos only** — no direct DB client usage outside `infra/postgres-*-repository.ts` files. Enforced by Biome rule + structure validator.
- **One validation system: Zod** — shared schemas in `@rhitta/contracts`. No AJV, no class-validator, no native Fastify schemas.
- **Central error handler** — domain errors mapped to HTTP status once, never per-handler.
- **Single auth gate location** — never scattered across middleware + layout + per-page. Pick one canonical layer per platform.
- **Realtime subscriptions go through one centralized hook factory** on web. Components never subscribe to a raw transport directly.

### Consumption model (hybrid)
Scaffolded projects copy most code (they own it) but keep these as runtime deps from `@rhitta/*`:
- `@rhitta/design-tokens` (so token updates can propagate)
- `@rhitta/contracts` (so API contract changes propagate to consumers)
- `@rhitta/biome-config` (so lint rules stay current)
- `@rhitta/tsconfig` (so TS configs stay current)

Everything else (apps, design system primitives, the constraint validator) is copied at scaffold time.

### npm scope
`@rhitta/*` — claim the `rhitta` npm org before publishing. Phase 0 doesn't publish anything; just set up the scope in package.json files.

---

## Phase 0 deliverables (what to build in this session)

Build the monorepo skeleton. Empty apps and empty packages are fine — the goal is **structure + tooling**, not features.

### Directory structure to create

```
rhitta/
├── .github/
│   └── workflows/
│       └── ci.yml                    # Lint, typecheck, structure-validate
├── .changeset/
│   └── config.json                   # Fixed versioning mode
├── apps/                              # Empty for now
│   └── .gitkeep
├── packages/                          # Empty for now
│   └── .gitkeep
├── tools/
│   └── structure-validator/          # Minimal validator (see below)
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   ├── adr/
│   │   ├── 0001-pnpm-workspaces.md
│   │   ├── 0002-hexagonal-architecture.md
│   │   ├── 0003-module-di-pattern.md
│   │   ├── 0004-zod-as-sole-validator.md
│   │   ├── 0005-db-seam-through-repos.md
│   │   ├── 0006-three-package-design-system-split.md
│   │   ├── 0007-tanstack-form-everywhere.md
│   │   ├── 0008-ignite-themed-approach-mobile.md
│   │   ├── 0009-encore-docker-default.md
│   │   ├── 0010-fixed-versioning.md
│   │   └── README.md                 # ADR index
│   └── conventions/
│       └── README.md                 # Pointer to AGENTS.md
├── .nvmrc                            # 22.11.0
├── .npmrc                            # engine-strict=true, etc.
├── .gitignore
├── .gitattributes
├── lefthook.yml                      # Pre-commit hooks
├── commitlint.config.mjs             # Conventional commits
├── biome.json                        # Root Biome config (strict)
├── tsconfig.base.json                # Base TS config (strict)
├── package.json                      # Root, dev-deps only
├── pnpm-workspace.yaml
├── pnpm-lock.yaml                    # Generated by pnpm install
├── AGENTS.md                         # THE document agents read first
├── CLAUDE.md                         # Symlink to AGENTS.md
├── README.md                         # Human-readable intro
└── LICENSE                           # MIT
```

### Key files — exact specs

#### `package.json` (root)
- `"private": true`
- `"name": "rhitta"`
- `"packageManager": "pnpm@10.x.y"` (use latest stable 10.x at time of execution; verify via `pnpm --version`)
- `"engines": { "node": ">=22.11.0", "pnpm": ">=10.0.0" }`
- Scripts:
  - `"typecheck": "pnpm -r typecheck"`
  - `"lint": "biome check ."`
  - `"format": "biome format --write ."`
  - `"validate": "pnpm -r --parallel validate && pnpm structure:validate"`
  - `"structure:validate": "pnpm --filter @rhitta/structure-validator start"`
  - `"changeset": "changeset"`
  - `"version": "changeset version"`
  - `"release": "changeset publish"`
  - `"prepare": "lefthook install"`
- devDependencies: `@biomejs/biome`, `@changesets/cli`, `@commitlint/cli`, `@commitlint/config-conventional`, `lefthook`, `typescript` (latest stable)

#### `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tools/*"
```

#### `.npmrc`
```
engine-strict=true
auto-install-peers=true
shamefully-hoist=false
```

#### `.nvmrc`
```
22.11.0
```

#### `tsconfig.base.json`
Strict everywhere. Targets ES2022, Bundler module resolution, no emit (each package emits its own way). Key flags:
- `"strict": true`
- `"noUncheckedIndexedAccess": true`
- `"noImplicitOverride": true`
- `"noFallthroughCasesInSwitch": true`
- `"verbatimModuleSyntax": true`
- `"isolatedModules": true`
- `"esModuleInterop": true`
- `"skipLibCheck": true`
- `"resolveJsonModule": true`

#### `biome.json`
Latest stable Biome config with strict rules. Must include:
- `noExplicitAny` as error
- `useExhaustiveDependencies` as error (for React)
- `noUnusedImports` as error
- `noUnusedVariables` as error
- Import organization on
- Format settings: 2-space indent, single quotes, trailing commas (es5), semicolons-as-needed
- `linter.rules.correctness.noUndeclaredDependencies` as error (when supported)

Note: **Rhitta-specific lint rules** (banning `@supabase/supabase-js` outside auth paths, banning `supabase.channel()` outside the centralized hook, etc.) are scoped per-package and added when those packages exist. Phase 0 only sets up the root foundation.

#### `lefthook.yml`
Pre-commit:
- Biome format + lint on staged files
- Typecheck on the workspace
- Structure validator on the workspace

Commit-msg:
- commitlint runs on the commit message

Pre-push:
- Full validate (lint + typecheck + structure)

Keep it fast — pre-commit should run in under 5 seconds on the empty skeleton.

#### `commitlint.config.mjs`
Extend `@commitlint/config-conventional`. Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `build`, `ci`, `revert`. Allowed scopes: `api`, `web`, `mobile`, `design-tokens`, `design-system-web`, `design-system-mobile`, `contracts`, `tsconfig`, `biome-config`, `structure-validator`, `cli`, `docs`, `ci`, `repo`.

#### `.changeset/config.json`
Fixed mode: all `@rhitta/*` packages share one version.

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [["@rhitta/*"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@rhitta/structure-validator"]
}
```

#### `.github/workflows/ci.yml`
On push and pull_request:
- Setup Node 22 from `.nvmrc`
- Setup pnpm matching `packageManager` field
- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm validate`

Single job for v0. Fast feedback over fancy matrix.

#### `tools/structure-validator/` (minimal v0)

This is the constraint enforcement layer. Phase 0 ships a **stub** that:
1. Walks the repo
2. Verifies the top-level structure exists (apps/, packages/, tools/, docs/, etc.)
3. Verifies AGENTS.md exists at root
4. Verifies every package in `packages/*` and `apps/*` has a `package.json` with a `@rhitta/*` name (when they exist — currently empty, so this check is a no-op pass)
5. Exits 0 if everything is fine, non-zero with a clear error message if not

Future phases will extend this validator with module structure checks (for the API module pattern), import boundary checks (no cross-module deep imports), and naming convention checks. Phase 0 just needs the skeleton present and runnable.

Implementation: TypeScript, single `src/index.ts`, exposes a CLI binary via package.json `bin` field. `package.json` has `"name": "@rhitta/structure-validator"`, `"private": true`. Use Node's built-in `fs` and `path` — no third-party deps beyond TypeScript.

#### `AGENTS.md` (root)

This is the canonical document AI agents read first. Write it in **imperative voice**, terse, no fluff. Structure:

1. **What Rhitta is** (one paragraph)
2. **The non-negotiable rules** (numbered list, ~10-15 items):
   - One way to do everything; deviation is forbidden
   - Follow the folder structure exactly
   - Database access only through repos
   - Validation only through Zod schemas in `@rhitta/contracts`
   - No direct external service clients in route handlers (use adapters)
   - Errors thrown as typed domain errors, mapped centrally
   - Forms only via TanStack Form
   - State: TanStack Query for server, Zustand for UI, never duplicate server state into client state
   - No `as any`, no `@ts-expect-error`, no `@ts-ignore` without ticket reference
   - Conventional commits required
   - Run `pnpm validate` before committing
3. **Where to put things** (decision tree for "I need to add X"):
   - New API endpoint → `apps/api/src/modules/<feature>/http/`
   - New shared type/schema → `packages/contracts/src/<domain>/`
   - New design primitive → `packages/design-system-web/src/primitives/` AND `packages/design-system-mobile/src/primitives/`
   - New theme token → `packages/design-tokens/src/`
   - New ADR → `docs/adr/`
4. **Commands you'll run** (`pnpm install`, `pnpm typecheck`, `pnpm validate`, etc.)
5. **When in doubt** (read the relevant ADR, ask the human, never invent a new pattern)

Keep it under 300 lines. Aspirational but specific. Update this doc as Rhitta grows.

#### `CLAUDE.md`
Symlink to `AGENTS.md` (`ln -s AGENTS.md CLAUDE.md` on Unix). Same content, accommodates Claude Code's default discovery.

#### `README.md`
Human-facing intro. What Rhitta is, who it's for, current status (alpha, in active development), how to set up locally, where to find AGENTS.md (the real doc). Keep it short.

#### `LICENSE`
Standard MIT, copyright Leo (use the year and your name).

#### `docs/adr/` files

Write each ADR with the standard template:

```
# ADR NNNN: Title

## Status
Accepted

## Context
What problem this solves, what alternatives were considered.

## Decision
The decision in one paragraph.

## Consequences
What this enables and what it costs.
```

Content for each ADR comes from this entire conversation. Compress the reasoning, don't expand it. Each ADR should be readable in under 2 minutes.

- **0001 pnpm-workspaces** — Why pnpm over npm/yarn, why plain workspaces over Nx/Turborepo for v0
- **0002 hexagonal-architecture** — Ports and adapters, why this matters for AI agents
- **0003 module-di-pattern** — Inherited from EmberForge, why it works
- **0004 zod-as-sole-validator** — Why one validation system, why Zod
- **0005 db-seam-through-repos** — ADR-0005 (matches EmberForge numbering for continuity), no direct DB client outside repos
- **0006 three-package-design-system-split** — Why three packages (tokens, web, mobile) instead of one
- **0007 tanstack-form-everywhere** — Why TanStack Form on both platforms
- **0008 ignite-themed-approach-mobile** — Why we use Ignite's native theming, not NativeWind
- **0009 encore-docker-default** — Why Encore.ts, why Docker as default deployment
- **0010 fixed-versioning** — Why all @rhitta/* packages share one version

#### `docs/adr/README.md`
Index of all ADRs with their titles and one-line summaries.

---

## What Phase 0 does NOT include

To prevent scope creep — these are explicitly out of scope for this session:

- Any `apps/*` content beyond the empty directory
- Any `packages/*` content beyond the empty directory
- The `create-rhitta` CLI (last phase)
- Generators for new modules/resources
- Tests (deferred to a later phase per locked decisions)
- Docs site (markdown only, no Docusaurus/Nextra)
- Storybook setup
- Actual Encore.ts setup
- Actual TanStack Start setup
- Actual Ignite/Expo setup
- Design tokens content (just an empty `@rhitta/design-tokens` package would be Phase 1, not Phase 0)
- Any business logic of any kind

If you find yourself doing any of the above, stop. That's Phase 1 or later.

---

## Acceptance criteria for Phase 0

The session is done when all of these pass on a clean machine:

1. `git clone <repo> && cd <repo>` works
2. `nvm use` picks up Node 22.11.0
3. `pnpm install` succeeds with no warnings beyond standard
4. `pnpm typecheck` runs (vacuously passes — no TS files outside tools/structure-validator yet)
5. `pnpm lint` passes
6. `pnpm validate` passes (structure validator finds the expected directories)
7. Making a commit with a non-conventional message fails via commitlint
8. Making a commit with a conventional message succeeds
9. CI on a dummy PR passes all checks
10. `AGENTS.md` exists, is comprehensive, and reflects the decisions in this handoff
11. All 10 ADRs exist with real content
12. `LICENSE`, `README.md`, `.gitignore`, `.gitattributes`, `.nvmrc`, `.npmrc` all exist

---

## Working principles for the next session

- **Verify versions at runtime.** This handoff says "pnpm 10.x" and "Biome latest stable" — confirm exact versions via `pnpm --version`, `npm view @biomejs/biome version`, etc. before writing them into config files. Don't hardcode versions from this doc that might be stale.
- **Use the `product-self-knowledge` skill** if you need details about Anthropic-related products. Use general web search for everything else (Encore.ts docs, TanStack docs, Biome docs).
- **Conventional commits as you go.** Every file batch is its own commit with a clear scope.
- **One PR worth of work.** This whole thing should land as one PR titled `feat(repo): initial Phase 0 skeleton`. Branch off `main`.
- **Don't ask the user mid-session for clarification on decisions already in this doc.** If something is ambiguous, follow the spirit of the locked decisions and document the choice in a new ADR. Better to make a call and note it than to wait.
- **Do ask if you hit something genuinely new** (e.g., "Biome doesn't support rule X anymore, here are three alternatives").

---

## Suggested skills for the next session

- `product-self-knowledge` — for any Anthropic-specific tooling questions
- Standard Claude Code tools (bash, str_replace, create_file, view) for filesystem work
- No need for skill-creator, to-prd, to-issues, or grill-with-docs in this session

---

## After Phase 0

Once Phase 0 ships, the next phases in order:

- **Phase 1** — Shared packages: `@rhitta/tsconfig`, `@rhitta/biome-config`, `@rhitta/design-tokens`, `@rhitta/contracts`. Empty-but-structured `@rhitta/design-system-web` and `@rhitta/design-system-mobile`.
- **Phase 2a** — API: Encore.ts setup, module DI pattern, reference resource end-to-end (CRUD + Zod contract + tests), reference agent run end-to-end, hexagonal adapters for auth/email/storage.
- **Phase 2b** — Web: TanStack Start setup, design system primitives, reference page consuming the API reference resource, TanStack Form integration, route conventions.
- **Phase 2c** — Mobile: Ignite scaffold, post-install overlay that applies Rhitta conventions, Ignite-themed design system mobile primitives, reference screen consuming the API.
- **Phase 3** — `create-rhitta` CLI, structure validator extended to enforce module patterns, generators for new modules/resources/agents.

Each phase is its own session with its own handoff doc. Don't try to merge them.

---

## Validation milestones (the wife's app test path)

After Phase 0 alone, nothing's testable in a real project — it's just a skeleton.

After Phase 2c (full v0), the wife's mobile app rewrite begins. Whatever breaks during that rewrite gets fixed in a Rhitta v0.1 release before EmberForge's design system migration starts.

This is documented here so future sessions remember the validation path and don't try to "release" Rhitta to other projects before the wife's app test completes.

---

End of handoff.
