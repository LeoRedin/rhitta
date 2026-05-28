# Rhitta — Phase 1 Shared Packages Handoff

**Date:** 2026-05-27
**For:** A fresh Claude Code session on a clean checkout of the Rhitta repo at the end of Phase 0
**Goal:** Build Phase 1 — the four real shared packages, the two empty-but-structured design-system packages, the extended structure-validator, and the release-workflow scaffold.

---

## Prerequisites (already done in Phase 0)

- pnpm workspaces, Biome 2.x, lefthook, commitlint, changesets in fixed mode.
- Node `.nvmrc` pinned to `22.22.3`; engines `>=22.12.0`.
- `tools/structure-validator` with three Phase 0 checks.
- AGENTS.md, CLAUDE.md symlink, README.md, LICENSE.
- Ten foundational ADRs (`docs/adr/0001-0010.md`) plus the four Phase 1 ADRs already written before this session begins: `0011` (Proposed), `0012`, `0013`, `0014`.
- CONTEXT.md glossary at repo root.
- `.github/workflows/ci.yml` running lint + typecheck + structure-validate on every PR.

If any of the above is missing on the branch you're working on, stop and reconcile before starting Phase 1 work.

---

## Locked Phase 1 decisions (do not relitigate)

These were resolved in a grilling session before this handoff was written. The relevant ADRs are listed; if something seems ambiguous, the ADR is the canonical source.

### Packages to ship in Phase 1 (six total)

| Package | Type | Publishable? | Status at end of Phase 1 |
|---------|------|--------------|--------------------------|
| `@rhitta/tsconfig` | Shared config | yes | Real content (four variants) |
| `@rhitta/biome-config` | Shared config | yes | Real content (`base` + `react`) |
| `@rhitta/design-tokens` | Runtime lib | yes | Real content (two layers, dual theme) |
| `@rhitta/contracts` | Runtime lib | yes | Real content (`shared/` only — no domain folders yet) |
| `@rhitta/design-system-web` | Runtime lib | yes | **Empty-but-structured** (directory + `package.json` only) |
| `@rhitta/design-system-mobile` | Runtime lib | yes | **Empty-but-structured** (directory + `package.json` only) |

Plus extensions to the existing `tools/structure-validator` (five new checks).

### `@rhitta/tsconfig` (ADR-0014)

Four files:
- `base.json` — moved from root `tsconfig.base.json`. Strict, ES2022 target, Bundler resolution by default, `noEmit: true`, `verbatimModuleSyntax`, `isolatedModules`.
- `node.json` — extends `base`. `module: NodeNext`, `moduleResolution: NodeNext`, `types: ["node"]`.
- `web.json` — extends `base`. `lib: ["ES2022", "DOM", "DOM.Iterable"]`, `jsx: "preserve"`, `types: ["vite/client"]`.
- `mobile.json` — extends `base`. `lib: ["ES2022"]`, `jsx: "react-jsx"`, `types: ["react-native"]`.

Root `tsconfig.base.json` becomes a thin re-export: `{ "extends": "@rhitta/tsconfig/base.json" }` — keeps Phase 0 consumers (`tools/structure-validator/tsconfig.json`) working without modification.

Library packages that publish `.d.ts` (tokens, contracts, design-system-*) also ship a `tsconfig.build.json` per package with `noEmit: false`, `declaration: true`, `emitDeclarationOnly: true` (or full emit if shipping JS too). Apps don't ship types.

### `@rhitta/biome-config` (ADR-0011 Proposed; ADR-0004 / ADR-0005 inform what *will* go in Phase 2)

Two files exported:
- `base.json` — refactored from current root `biome.json`. Formatting (2-space, single quotes, trailing commas es5, line width 100), import organize on, `noExplicitAny: error`, `noUnusedImports: error`, `noUnusedVariables: error`, `noUndeclaredDependencies: error`, `useImportType: error`, `useExportType: error`.
- `react.json` — extends `base`. React/JSX rules (`useExhaustiveDependencies: error`, `noArrayIndexKey: error`, `useKeyWithClickEvents: warn`).

Root `biome.json` becomes `{ "extends": ["@rhitta/biome-config/base"] }`. Every package's `biome.json` extends exactly one of the two.

**No architectural ban rules in Phase 1.** ADR-0011 captures the forward spec. Phase 2 implements.

### `@rhitta/design-tokens` (ADR-0012)

Two-layer architecture, dual theme, single source of truth in TypeScript:

```
packages/design-tokens/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── biome.json
├── scripts/
│   └── build-css.ts          # reads src/, emits dist/*.css
├── src/
│   ├── primitive.ts          # raw values, never read by components
│   ├── semantic.ts           # aliases by theme: { light: ..., dark: ... }
│   ├── types.ts              # shared types
│   └── index.ts              # re-export both layers
└── dist/                     # build output (gitignored)
```

`package.json` exports:
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./primitive": "./dist/primitive.js",
    "./semantic": "./dist/semantic.js",
    "./css": "./dist/tokens.css",
    "./tailwind": "./dist/theme.css"
  }
}
```

**Primitive content** (target ~63 leaves):
- `colors.brand`: { primary, secondary }
- `colors.neutral`: { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 }
- `colors.semantic`: { success, danger, warning, info } (single shade each)
- `spacing`: { 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32 } in 4px steps
- `radii`: { none, sm, md, lg, xl, '2xl', full }
- `typography.fontFamily`: { sans, mono }
- `typography.fontSize`: { xs, sm, base, lg, xl, '2xl', '3xl', '4xl' }
- `typography.fontWeight`: { regular, medium, semibold, bold }
- `typography.lineHeight`: { tight, normal, relaxed }
- `motion.duration`: { instant, fast, normal, slow } in ms
- `motion.easing`: { linear, in, out, inOut } (CSS cubic-bezier strings)

Pick conservative defaults — slate-leaning neutrals, a placeholder brand blue/teal, semantic colors that work on both light and dark surfaces. Document choices inline in `primitive.ts`. Consumers will override.

**Semantic content** (target ~20 leaves):
- `bg`: { app, surface, surfaceRaised, inverse }
- `text`: { body, muted, inverse, brand, danger }
- `border`: { default, strong, focus }
- `shadow`: { sm, md, lg } (optional; can defer to Phase 2 if you want fewer leaves)

Each semantic entry has `{ light, dark }` values, each pointing at a primitive:
```ts
export const semantic = {
  bg: {
    app:           { light: colors.neutral[50],  dark: colors.neutral[950] },
    surface:       { light: colors.neutral[0],   dark: colors.neutral[900] },
    surfaceRaised: { light: colors.neutral[50],  dark: colors.neutral[800] },
    inverse:       { light: colors.neutral[900], dark: colors.neutral[50]  },
  },
  text: {
    body:    { light: colors.neutral[900], dark: colors.neutral[50] },
    muted:   { light: colors.neutral[600], dark: colors.neutral[400] },
    inverse: { light: colors.neutral[50],  dark: colors.neutral[900] },
    brand:   { light: colors.brand.primary, dark: colors.brand.primary },
    danger:  { light: colors.semantic.danger, dark: colors.semantic.danger },
  },
  // ...
}
```

Note: `colors.neutral[0]` (pure white) isn't in the primitive list above — add it if needed, or use `#FFFFFF` directly in semantic where appropriate.

**Build script** (`scripts/build-css.ts`):
- Pure Node, no third-party deps beyond `typescript` and `@types/node`
- Reads compiled `dist/primitive.js` + `dist/semantic.js`
- Emits `dist/tokens.css`:
  ```css
  :root {
    --color-brand-primary: <value>;
    /* ... primitives ... */
    --color-bg-app: <light value>;
    /* ... semantics resolved to light ... */
  }
  [data-theme="dark"] {
    --color-bg-app: <dark value>;
    /* ... semantics resolved to dark ... */
  }
  ```
- Emits `dist/theme.css`:
  ```css
  @theme {
    --color-brand-primary: var(--color-brand-primary);
    --color-bg-app: var(--color-bg-app);
    /* ... mappings for Tailwind v4 ... */
  }
  ```

CSS variable names follow Tailwind v4 canonical: `--color-*`, `--spacing-*`, `--font-*`, `--radius-*`, `--duration-*`, `--ease-*`. **No `--rhitta-*` vendor prefix.**

`package.json` scripts:
- `"build": "tsc -p tsconfig.build.json && tsx scripts/build-css.ts"` (use `tsx` if needed; or compile the script via tsc first then run with node)
- `"typecheck": "tsc -p tsconfig.json --noEmit"`
- `"validate": "pnpm typecheck && pnpm build"`

### `@rhitta/contracts` (ADR-0013)

Per-domain folders, per-subpath exports, three-shapes-per-entity boundary.

**Phase 1 deliverable:** package skeleton + only the `shared/` domain populated.

```
packages/contracts/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── biome.json
└── src/
    └── shared/
        ├── ids.ts          # brand helper, future ID schemas
        ├── pagination.ts   # CursorSchema, PageSchema (basic)
        ├── result.ts       # generic Result envelope if useful (optional)
        └── index.ts
```

No domain folders yet — those land per-feature in Phase 2 as modules ship.

`package.json` exports:
```json
{
  "exports": {
    "./shared": "./dist/shared/index.js"
  }
}
```

`dependencies` includes `zod` (latest 4.x or current stable — verify at runtime via `npm view zod version`).

Sample `shared/ids.ts`:
```ts
import { z } from 'zod'

export const brand = <Schema extends z.ZodTypeAny, Brand extends string>(
  schema: Schema,
  brandName: Brand,
) => schema.brand<Brand>()

// Concrete branded IDs land here as domains accumulate, e.g.:
// export const UserIdSchema = brand(z.string().uuid(), 'UserId')
// export type UserId = z.infer<typeof UserIdSchema>
```

Sample `shared/pagination.ts`:
```ts
import { z } from 'zod'

export const CursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
})
export type Cursor = z.infer<typeof CursorSchema>

export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  })
```

### `@rhitta/design-system-web` and `@rhitta/design-system-mobile` (empty-but-structured)

Each gets:
- `package.json` with `@rhitta/<name>` and `workspace:*` dependency on `@rhitta/design-tokens` and `@rhitta/contracts` (where applicable later)
- `tsconfig.json` extending `@rhitta/tsconfig/web.json` or `mobile.json`
- `tsconfig.build.json` for `.d.ts` emit
- `biome.json` extending `@rhitta/biome-config/react`
- `src/primitives/.gitkeep`
- `src/index.ts` with just `export {}` or a placeholder comment

Goal: structure validator passes, install resolves, no real components. Phase 2b and 2c populate.

### Extensions to `tools/structure-validator` (ADR-0003 / ADR-0006)

Add five new checks (Phase 0 had three). Refactor `src/index.ts` into a `checks/` folder:

```
tools/structure-validator/src/
├── index.ts                       # CLI entry; runs all checks
├── types.ts                       # Failure type with optional adrRef field
└── checks/
    ├── required-top-level.ts     # existing checks 1+2
    ├── workspace-name.ts          # existing check 3
    ├── workspace-shape.ts         # NEW — every workspace has the required files
    ├── tsconfig-inheritance.ts    # NEW — extends matches @rhitta/tsconfig/<variant>.json
    ├── biome-inheritance.ts       # NEW — biome.json extends base or react
    ├── package-naming.ts          # NEW — package name matches folder
    └── workspace-deps.ts          # NEW — workspace:* protocol, no cycles, no apps↔apps deps
```

Each check exports `({ repoRoot }) => Failure[]`. `Failure` gains an optional `adrRef: string` field. CLI output appends `(see ADR-XXXX)` when set.

**Variant-by-workspace mapping** (consumed by `tsconfig-inheritance.ts`):
- `tools/*` → `@rhitta/tsconfig/node.json`
- `apps/api` → `@rhitta/tsconfig/node.json`
- `apps/web` → `@rhitta/tsconfig/web.json`
- `apps/mobile` → `@rhitta/tsconfig/mobile.json`
- `packages/tsconfig` → `@rhitta/tsconfig/node.json`
- `packages/biome-config` → `@rhitta/tsconfig/node.json`
- `packages/design-tokens` → `@rhitta/tsconfig/node.json` (it's a build-time package; runtime is consumers' problem)
- `packages/contracts` → `@rhitta/tsconfig/base.json` (platform-agnostic)
- `packages/design-system-web` → `@rhitta/tsconfig/web.json`
- `packages/design-system-mobile` → `@rhitta/tsconfig/mobile.json`

The check loads each workspace's `tsconfig.json` (JSON parse only — no chain resolution), reads the `extends` field, and compares as a string against the expected variant. If the workspace isn't in the mapping (a future package), it requires *some* `@rhitta/tsconfig/*` extends and warns on the mapping itself — encourage adding it.

All checks are hard errors. No opt-out file. Vacuous pass when target directories are absent.

### `.github/workflows/release.yml`

Scaffold the release workflow now; do not auto-publish. Fires only on tag push `v*`:

```yaml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: read
  id-token: write  # for npm provenance via OIDC

jobs:
  release:
    name: Build and publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm validate
      - run: pnpm -r --filter './packages/*' build
      - run: pnpm changeset publish --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

No tag, no publish. Leo adds `NPM_TOKEN` secret when ready.

### Versioning posture

- All publishable packages have `"version": "0.0.0"` in source.
- All have `"publishConfig": { "access": "public" }`.
- `@rhitta/structure-validator` keeps `"private": true` and stays in changesets' `ignore` list.
- Engineers write changeset markdown files (`pnpm changeset`) as features land.
- **Do not run `pnpm changeset version` in Phase 1.** First version cut happens post-validation-milestone (per Phase 0 handoff).

### npm scope claim

Leo's manual action — out of scope for the session that implements Phase 1. The handoff document for this session should remind Leo to do it before Phase 2 ships (it doesn't block Phase 1 work since nothing publishes).

---

## Phase 1 deliverables — concrete file list

```
packages/
├── tsconfig/
│   ├── package.json                     # @rhitta/tsconfig, type: module
│   ├── base.json
│   ├── node.json
│   ├── web.json
│   └── mobile.json
├── biome-config/
│   ├── package.json                     # @rhitta/biome-config
│   ├── base.json
│   └── react.json
├── design-tokens/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── biome.json
│   ├── scripts/build-css.ts
│   └── src/{primitive,semantic,types,index}.ts
├── contracts/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── biome.json
│   └── src/shared/{ids,pagination,result?,index}.ts
├── design-system-web/
│   ├── package.json                     # workspace dep on @rhitta/design-tokens
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── biome.json
│   └── src/{primitives/.gitkeep,index.ts}
└── design-system-mobile/
    ├── package.json                     # workspace dep on @rhitta/design-tokens
    ├── tsconfig.json
    ├── tsconfig.build.json
    ├── biome.json
    └── src/{primitives/.gitkeep,index.ts}

tools/structure-validator/src/           # refactored
├── index.ts
├── types.ts
└── checks/
    ├── required-top-level.ts
    ├── workspace-name.ts
    ├── workspace-shape.ts                # NEW
    ├── tsconfig-inheritance.ts           # NEW
    ├── biome-inheritance.ts              # NEW
    ├── package-naming.ts                 # NEW
    └── workspace-deps.ts                 # NEW

.github/workflows/release.yml             # NEW

tsconfig.base.json                        # MODIFY: thin re-export
biome.json                                # MODIFY: thin re-export
```

---

## Acceptance criteria

The Phase 1 session is done when **all** of these pass on a clean machine:

1. `pnpm install --frozen-lockfile` succeeds.
2. `pnpm typecheck` passes for every workspace.
3. `pnpm lint` passes.
4. `pnpm -r build` builds every publishable package successfully (`@rhitta/tsconfig` and `@rhitta/biome-config` may be no-ops; `@rhitta/design-tokens` emits `dist/*.css`; `@rhitta/contracts` emits `dist/shared/index.js` + `.d.ts`).
5. `pnpm validate` runs all eight structure-validator checks and reports `[rhitta:structure] OK`.
6. `pnpm changeset` runs without error in a workspace that has changes (smoke test only).
7. The root `tsconfig.base.json` and `biome.json` are thin re-exports of the new packages; `tools/structure-validator` continues to typecheck.
8. ADR-0011 status is `Proposed`; ADRs 0012, 0013, 0014 are `Accepted`. ADR index updated.
9. CONTEXT.md reflects the new vocabulary (primitive token, semantic token, theme, wire schema).
10. `.github/workflows/release.yml` exists, is well-formed YAML, and does NOT auto-fire on regular pushes.
11. CI is green on the Phase 1 PR.

---

## What Phase 1 does NOT include

To prevent scope creep:

- `apps/api`, `apps/web`, `apps/mobile` — Phase 2.
- Any module content (`domain/application/infra/http`) — Phase 2.
- Any design primitive components in `design-system-web` or `design-system-mobile` — Phase 2b/2c.
- Any domain contracts beyond `shared/` — Phase 2.
- Biome `noRestrictedImports` ban rules — Phase 2 (ADR-0011).
- The `create-rhitta` CLI — Phase 3.
- Generators (`gen:module`, `gen:resource`, `gen:agent`) — Phase 3.
- Tests — deferred per Phase 0 handoff.
- Storybook — not in scope.
- Actual Encore.ts, TanStack Start, or Ignite setup — Phase 2.
- Publishing `@rhitta/*` to npm — post-validation-milestone.

If you find yourself doing any of the above, stop.

---

## Working principles for the next session

- **Verify versions at runtime.** Confirm `zod`, `@types/node`, and any tool versions via `npm view <pkg> version` before pinning. The handoff says "Zod 4.x or current stable" — check first.
- **One PR worth of work** titled `feat(repo): Phase 1 shared packages`.
- **Conventional commits as you go.** Suggested scopes:
  - `feat(tsconfig): ship four-variant @rhitta/tsconfig`
  - `feat(biome-config): ship @rhitta/biome-config base + react`
  - `feat(design-tokens): two-layer tokens with dual theme`
  - `feat(contracts): @rhitta/contracts skeleton with shared domain`
  - `feat(design-system-web): empty-but-structured package`
  - `feat(design-system-mobile): empty-but-structured package`
  - `feat(structure-validator): five new workspace shape checks`
  - `ci(repo): release workflow scaffold`
  - `docs(repo): ADR index + handoffs updates`
- **Pre-commit hooks must continue to pass.** Each commit must leave the workspace in a `pnpm validate`-green state. If a commit would break this, split or reorder.
- **Don't ask the user mid-session for clarification on decisions in this doc.** Follow the spirit of the locked decisions; document any micro-choice in a new ADR (next free number — 0015 onward).
- **Do ask if something genuinely new comes up** (e.g., "Tailwind v4 changed the `@theme` syntax — here are the alternatives").

---

## Suggested skills for the next session

- Standard Claude Code tools (Read, Edit, Write, Bash).
- No need for `grill-with-docs`, `to-prd`, `to-issues`, `brainstorming` — the decisions are locked.
- `verify` is useful at the end (run `pnpm validate` in a fresh shell to confirm acceptance criteria).

---

## After Phase 1

Per the Phase 0 handoff, the next phases are:
- **Phase 2a** — `apps/api` (Encore.ts, modules, reference resource, reference agent run, hexagonal adapters).
- **Phase 2b** — `apps/web` (TanStack Start, design system primitives, reference page, forms).
- **Phase 2c** — `apps/mobile` (Ignite scaffold + post-install overlay, design system mobile primitives, reference screen).
- **Phase 3** — `create-rhitta` CLI, extended structure-validator (module + import boundary + naming), generators.

Each phase is its own session with its own handoff doc.

---

## Validation milestone (unchanged from Phase 0)

After Phase 2c (full v0), Leo's wife's mobile app rewrite begins. Whatever breaks during that rewrite gets fixed in a Rhitta v0.1 release before EmberForge's design system migration starts. Rhitta does not publish to npm before this milestone.

---

End of Phase 1 handoff.
