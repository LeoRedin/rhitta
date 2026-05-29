# create-rhitta CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a published, unscoped `create-rhitta` CLI that scaffolds a new project by **vendoring** the whole Rhitta monorepo (all three apps + packages + tools), stripping Rhitta-internal artifacts, and rewriting a fixed set of project identifiers from interactive (or flag-supplied) answers.

**Architecture:** Hexagonal-ish, small modules. A **source resolver** materializes a clean copy of the Rhitta tree into a temp dir — either from a local checkout (`--from <path>`, via `git archive`, used for testing pre-publish) or from a published GitHub tag (via `tiged`, the maintained `degit` fork). A **transform pipeline** then runs over that temp dir: `strip` (delete Rhitta-internal files), `rewriteIdentifiers` (targeted, file-specific replacements — NOT a global string sweep), and `writeReadme` (replace the root README with a generated one). **Post steps** move the tree to the target dir, optionally `git init` and install. Prompts use `@clack/prompts`; every prompt has a matching flag for non-interactive use.

**Tech Stack:** TypeScript (ESM, `@rhitta/tsconfig/node`), `@clack/prompts`, `tiged`, Node built-ins (`node:fs`, `node:path`, `node:child_process`, `node:os`), Vitest, Biome.

---

## Critical context for every implementer

- **Repo:** `/Users/redin/Projects/personal/rhitta`, branch `main` (direct-on-main authorized).
- **Package location & name:** `tools/create-rhitta/`, package name **`create-rhitta`** (UNSCOPED — it is the one published exception to "internal tool"; see CONTEXT.md "Published CLI" + ADR-0027). Independent version `0.1.0` (NOT in the `@rhitta/*` fixed[] changeset group). `"private"` MUST be absent/false so changesets/npm publish it. `"type": "module"`.
- **Commit convention:** Conventional Commits. Valid scopes (commitlint enum): `api, web, mobile, design-tokens, design-system-web, design-system-mobile, contracts, tsconfig, biome-config, structure-validator, cli, docs, ci, repo`. Use scope **`cli`** for create-rhitta work. NO `Co-Authored-By`. Prefix git commit/push with `rtk proxy `. Do NOT use `--no-verify`. Lefthook pre-commit runs Biome + structure-validate + `pnpm -r typecheck`; commit-msg runs commitlint.
- **The vendored model:** downstream KEEPS the `@rhitta/*` package namespace (they are `workspace:*` local deps, never re-published by the consumer). Only a fixed set of *project identifiers* changes. Do NOT rename `@rhitta/*`.
- **Mobile is managed-workflow / CNG:** no `ios/`/`android/` are committed, so the scaffold does NOT run `ignite-cli` and does NOT prebuild; downstream runs `expo prebuild` themselves. `apps/mobile` is already convention-clean (post the mobile-toolchain-cleanup that shipped in `c96036a`).

### The identifier rewrite map (authoritative — used by Task 5)

These are the ONLY string replacements. Each is file-specific and key-specific. `${slug}` = sanitized project slug; `${appName}` = display name; `${encoreId}` = encore app id; `${bundleId}` = reverse-DNS bundle id; `${scheme}` = deep-link scheme.

| File | Location / key | From | To |
|------|----------------|------|----|
| `package.json` (root) | JSON key `name` | `"rhitta"` | `${slug}` |
| `apps/api/encore.app` | JSON key `id` | `"rhitta"` | `${encoreId}` |
| `apps/api/.env.example` | line `S3_BUCKET=rhitta` | `rhitta` | `${slug}` |
| `apps/mobile/app.json` | JSON key `name` | `"mobile"` | `${appName}` |
| `apps/mobile/app.json` | JSON key `slug` | `"mobile"` | `${slug}` |
| `apps/mobile/app.json` | JSON key `scheme` | `"rhitta"` | `${scheme}` |
| `apps/mobile/app.json` | JSON `android.package` | `"com.rhitta.app"` | `${bundleId}` |
| `apps/mobile/app.json` | JSON `ios.bundleIdentifier` | `"com.rhitta.app"` | `${bundleId}` |
| `apps/mobile/package.json` | script `test:maestro` `MAESTRO_APP_ID=` | `com.rhitta.app` | `${bundleId}` |
| `apps/mobile/scripts/gen-api-client.sh` | shell var `APP_ID=` | `"rhitta"` | `"${encoreId}"` |
| `apps/web/scripts/gen-api-client.sh` | shell var `APP_ID=` | `"rhitta"` | `"${encoreId}"` |

Notes:
- `apps/mobile/package.json` `name` STAYS `@rhitta/mobile` (namespace kept). Only the `MAESTRO_APP_ID` substring changes.
- The two `gen-api-client.sh` files have prose comments mentioning `rhitta` (e.g. "the `rhitta` app"); those are cosmetic and left alone — only the `APP_ID=` assignment is authoritative and must match `encore.app`.
- `tools/structure-validator/package.json` `description` ("Validates Rhitta repo structure…") is left alone — it's a tool description, not a project identifier.

### The strip list (authoritative — used by Task 4)

Delete these from the materialized tree (paths relative to tree root):
- `docs/handoffs/` (entire dir — Rhitta dev history)
- `docs/superpowers/` (entire dir — Rhitta planning artifacts)
- `apps/mobile/scripts/rhitta-overlay.sh` (build-time tool; not shipped)
- `apps/mobile/.rhitta-overlay-applied` (overlay marker)
- any `CHANGELOG.md` at repo root or in workspaces (Rhitta's release history; downstream starts fresh) — but KEEP `.changeset/config.json` and `.changeset/README.md`
- `.git/` (only relevant to the `--from` copy path; `git archive`/`tiged` already exclude it — defense in depth)

KEEP (do NOT strip): `docs/adr/`, `CONTEXT.md`, `AGENTS.md`, `tools/structure-validator/`, `.changeset/config.json`, all `apps/*`, all `packages/*`, `.github/`, lefthook/biome/commitlint configs.

REPLACE: root `README.md` (Task 6 generates a project-specific one).

### Identifier sanitization rules (used by Task 2)

- `slug`: lowercase the project name; replace any run of non-`[a-z0-9]` with `-`; trim leading/trailing `-`. Must be non-empty and `^[a-z0-9][a-z0-9-]*$`.
- `encoreId`: same as `slug` (Encore app ids are lowercase-alphanumeric-hyphen). Default = `slug`.
- `scheme`: `slug` with hyphens removed (deep-link schemes should be a single alnum token), lowercased. Default = `slug.replace(/-/g,'')`.
- `appName`: free-form display string; default = the raw project name.
- `bundleId`: must match `^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$` (reverse-DNS, ≥2 segments). No default that could collide — prompt required, or `--bundle-id`.

---

## File structure (locked here)

```
tools/create-rhitta/
  package.json            # name "create-rhitta", bin, deps, independent version
  tsconfig.json           # extends @rhitta/tsconfig/node
  biome.json              # extends @rhitta/biome-config/base, "root": false
  vitest.config.ts
  README.md               # the published package readme (usage)
  src/
    index.ts              # bin entry: parse argv -> params -> orchestrate
    types.ts              # ScaffoldParams, RawFlags
    params.ts             # sanitizeSlug/encoreId/scheme, validateBundleId, buildParams
    prompts.ts            # clack interactive flow; merges flags
    source.ts             # resolveSource(): local (git archive) | remote (tiged)
    strip.ts              # applyStripList()
    rewrite.ts            # rewriteIdentifiers() using the map above
    readme.ts             # renderReadme()
    post.ts               # finalize(): move into place, git init, install
  test/
    params.test.ts
    strip.test.ts
    rewrite.test.ts
    readme.test.ts
    fixtures/             # tiny fake-tree fixtures for strip/rewrite tests
```

---

## Task 1: ADR-0027 + scaffold the `create-rhitta` package + structure-validator exception

**Files:**
- Create: `docs/adr/0027-create-rhitta-vendored-scaffold.md`
- Modify: `docs/adr/README.md` (index row)
- Create: `tools/create-rhitta/package.json`, `tools/create-rhitta/tsconfig.json`, `tools/create-rhitta/biome.json`, `tools/create-rhitta/vitest.config.ts`, `tools/create-rhitta/README.md`, `tools/create-rhitta/src/index.ts` (temporary stub)
- Modify: `tools/structure-validator/src/checks/package-naming.ts`
- Modify: `pnpm-lock.yaml` (install)

- [ ] **Step 1: Write ADR-0027.** Create `docs/adr/0027-create-rhitta-vendored-scaffold.md`:

```markdown
# ADR 0027: create-rhitta vendored-scaffold model

## Status
Accepted

## Context
Rhitta needs a `create-rhitta` CLI so new projects start from the boilerplate
(`npm create rhitta@latest my-app`). Two models were considered: (C) a thin scaffold
whose output consumes published `@rhitta/*` packages from npm, and (V) a vendored
scaffold that copies the whole monorepo so the downstream project owns every file.

Rhitta's thesis — machine-enforced conventions, deviation visibly wrong — only holds if
`tools/structure-validator`, the Biome configs, and the design tokens ship INSIDE the
scaffolded repo and run on every commit. Model C cannot enforce structure on code it
does not contain, and design tokens/contracts are meant to be edited per product. Model V
also needs nothing on npm to work, which unblocks testing before the @rhitta scope is
published.

`create-rhitta` itself must be public (npx/`npm create` resolve it from the registry). It
is the sole `tools/*` workspace that is published — the exception to the "internal tool"
rule in CONTEXT.md.

## Decision
`create-rhitta` is published unscoped and vendors the full Rhitta tree (all three apps +
packages + tools). The downstream project keeps the `@rhitta/*` namespace (local
`workspace:*` deps, never re-published by the consumer). Only a fixed, file-specific set
of project identifiers is rewritten (root package name, Encore app id, mobile
name/slug/scheme/bundle id). Rhitta-internal artifacts (handoffs, planning docs, the
mobile overlay script) are stripped; the README is regenerated.

`create-rhitta` carries an INDEPENDENT version, not the `@rhitta/*` fixed[] version
(ADR-0010), because consumers run it standalone before any `@rhitta/*` package exists.

The CLI vendors a clean tree (no live `ignite-cli`): `apps/mobile` is committed in
managed/CNG form, so downstream runs `expo prebuild` to materialize native projects.

## Consequences
- A v0.2 Rhitta improvement does not auto-reach scaffolded projects (no update channel).
  A future `rhitta upgrade` codemod is out of scope for v0.
- The `package-naming` structure check must allow the one unscoped name `create-rhitta`.
- The CLI has two source backends: local (`--from`, `git archive`, for pre-publish
  testing) and remote (`tiged` on a GitHub tag, the published path).
```

- [ ] **Step 2: Index row.** In `docs/adr/README.md`, add after the 0026 row:

```markdown
| [0027](./0027-create-rhitta-vendored-scaffold.md) | create-rhitta vendored scaffold | Public unscoped CLI vendors the whole monorepo; keeps `@rhitta/*`, rewrites project ids; independent version |
```

- [ ] **Step 3: Scaffold the package files.**

`tools/create-rhitta/package.json`:
```json
{
  "name": "create-rhitta",
  "version": "0.1.0",
  "description": "Scaffold a new Rhitta monorepo project.",
  "license": "MIT",
  "type": "module",
  "bin": {
    "create-rhitta": "./dist/index.js"
  },
  "files": ["dist"],
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "validate": "pnpm run typecheck && pnpm run test"
  },
  "dependencies": {
    "@clack/prompts": "0.11.0",
    "tiged": "3.0.0"
  },
  "devDependencies": {
    "@rhitta/biome-config": "workspace:*",
    "@rhitta/tsconfig": "workspace:*",
    "@types/node": "22.19.19",
    "typescript": "6.0.3",
    "vitest": "3.2.4"
  }
}
```
(If any pinned version fails to resolve, use the nearest existing version already in the repo's lockfile for `typescript`/`@types/node`/`vitest`, and the latest stable for `@clack/prompts`/`tiged`; note the chosen versions in your report.)

`tools/create-rhitta/tsconfig.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@rhitta/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

`tools/create-rhitta/biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "root": false,
  "extends": ["@rhitta/biome-config/base"]
}
```

`tools/create-rhitta/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
```

`tools/create-rhitta/README.md`:
```markdown
# create-rhitta

Scaffold a new [Rhitta](https://github.com/LeoRedin/rhitta) project.

```bash
npm create rhitta@latest my-app
# or: pnpm create rhitta my-app
# or: npx create-rhitta my-app
```

The CLI vendors the full Rhitta monorepo (api + web + mobile + packages + tools),
rewrites the project identifiers you provide, and leaves you a ready-to-build workspace.

## Flags

| Flag | Meaning |
|------|---------|
| `<dir>` | Target directory (positional). Prompted if omitted. |
| `--name <s>` | App display name. |
| `--bundle-id <s>` | Mobile reverse-DNS bundle id (e.g. `com.acme.app`). |
| `--from <path>` | Vendor from a local Rhitta checkout instead of GitHub (testing). |
| `--ref <git-ref>` | GitHub ref/tag to vendor from (default: latest release). |
| `--no-install` | Skip dependency install. |
| `--no-git` | Skip `git init`. |
```

`tools/create-rhitta/src/index.ts` (temporary stub — replaced in Task 8):
```ts
export {}
```

- [ ] **Step 4: Allow the unscoped name in the structure validator.** In `tools/structure-validator/src/checks/package-naming.ts`, the loop currently requires `name === \`@rhitta/${entry.name}\``. Add an exception for the published CLI. Locate this block:

```ts
      const name = typeof pkg.name === 'string' ? pkg.name : ''
      const expected = `@rhitta/${entry.name}`
      if (name !== expected) {
```

Replace it with:

```ts
      const name = typeof pkg.name === 'string' ? pkg.name : ''
      // The sole published CLI is unscoped by npm `create-*` convention (ADR-0027).
      if (wsRel === 'tools/create-rhitta') {
        if (name !== 'create-rhitta') {
          failures.push({
            path: `${wsRel}/package.json`,
            reason: `package name "${name}" must equal "create-rhitta" (published CLI; ADR-0027)`,
            adrRef: 'ADR-0027',
          })
        }
        continue
      }
      const expected = `@rhitta/${entry.name}`
      if (name !== expected) {
```

- [ ] **Step 5: Install + verify the workspace is healthy.**

Run: `cd /Users/redin/Projects/personal/rhitta && rtk proxy pnpm install`
Expected: `create-rhitta` is picked up as a workspace; `@clack/prompts` + `tiged` installed.

Run: `cd /Users/redin/Projects/personal/rhitta && pnpm structure:validate`
Expected: `[rhitta:structure] OK` (the new unscoped package does NOT trip `package-naming`).

Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta typecheck`
Expected: passes (empty stub typechecks).

- [ ] **Step 6: Commit.**
```bash
cd /Users/redin/Projects/personal/rhitta
git add docs/adr tools/create-rhitta tools/structure-validator pnpm-lock.yaml
rtk proxy git commit -m "feat(cli): scaffold create-rhitta package + ADR-0027 + structure-validator exception"
```

---

## Task 2: Params — types, sanitization, validation (TDD)

**Files:**
- Create: `tools/create-rhitta/src/types.ts`, `tools/create-rhitta/src/params.ts`
- Test: `tools/create-rhitta/test/params.test.ts`

- [ ] **Step 1: Write the failing test.** Create `tools/create-rhitta/test/params.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { sanitizeSlug, deriveEncoreId, deriveScheme, isValidBundleId, buildParams } from '../src/params.js'

describe('sanitizeSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(sanitizeSlug('My Cool App')).toBe('my-cool-app')
  })
  it('collapses runs of non-alphanumerics and trims', () => {
    expect(sanitizeSlug('  Foo__Bar!!Baz  ')).toBe('foo-bar-baz')
  })
  it('throws on empty result', () => {
    expect(() => sanitizeSlug('!!!')).toThrow()
  })
})

describe('deriveScheme', () => {
  it('removes hyphens from the slug', () => {
    expect(deriveScheme('my-cool-app')).toBe('mycoolapp')
  })
})

describe('deriveEncoreId', () => {
  it('equals the slug', () => {
    expect(deriveEncoreId('my-cool-app')).toBe('my-cool-app')
  })
})

describe('isValidBundleId', () => {
  it('accepts reverse-DNS with >=2 segments', () => {
    expect(isValidBundleId('com.acme.app')).toBe(true)
    expect(isValidBundleId('com.acme')).toBe(true)
  })
  it('rejects single segment, uppercase, leading digit', () => {
    expect(isValidBundleId('app')).toBe(false)
    expect(isValidBundleId('Com.Acme.App')).toBe(false)
    expect(isValidBundleId('com.1acme.app')).toBe(false)
  })
})

describe('buildParams', () => {
  it('fills derived defaults from name when only name+bundleId+dir given', () => {
    const p = buildParams({ dir: 'out', name: 'My Cool App', bundleId: 'com.acme.app' })
    expect(p).toEqual({
      targetDir: 'out',
      appName: 'My Cool App',
      slug: 'my-cool-app',
      encoreId: 'my-cool-app',
      scheme: 'mycoolapp',
      bundleId: 'com.acme.app',
    })
  })
  it('throws on an invalid bundleId', () => {
    expect(() => buildParams({ dir: 'out', name: 'X', bundleId: 'nope' })).toThrow(/bundle/i)
  })
})
```

- [ ] **Step 2: Run it, verify failure.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/params.test.ts`
Expected: FAIL (module `../src/params.js` not found / functions undefined).

- [ ] **Step 3: Implement.** Create `tools/create-rhitta/src/types.ts`:

```ts
export interface ScaffoldParams {
  targetDir: string
  appName: string
  slug: string
  encoreId: string
  scheme: string
  bundleId: string
}

export interface RawFlags {
  dir?: string
  name?: string
  bundleId?: string
  from?: string
  ref?: string
  install: boolean
  git: boolean
}

export interface BuildParamsInput {
  dir: string
  name: string
  bundleId: string
}
```

Create `tools/create-rhitta/src/params.ts`:

```ts
import type { BuildParamsInput, ScaffoldParams } from './types.js'

export function sanitizeSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug.length === 0) {
    throw new Error(`Cannot derive a slug from "${input}" — use letters or digits.`)
  }
  return slug
}

export function deriveEncoreId(slug: string): string {
  return slug
}

export function deriveScheme(slug: string): string {
  return slug.replace(/-/g, '')
}

export function isValidBundleId(value: string): boolean {
  return /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(value)
}

export function buildParams(input: BuildParamsInput): ScaffoldParams {
  if (!isValidBundleId(input.bundleId)) {
    throw new Error(
      `Invalid bundle id "${input.bundleId}". Use reverse-DNS, e.g. com.acme.app.`,
    )
  }
  const slug = sanitizeSlug(input.name)
  return {
    targetDir: input.dir,
    appName: input.name,
    slug,
    encoreId: deriveEncoreId(slug),
    scheme: deriveScheme(slug),
    bundleId: input.bundleId,
  }
}
```

- [ ] **Step 4: Run tests, verify pass.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/params.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit.**
```bash
cd /Users/redin/Projects/personal/rhitta
git add tools/create-rhitta/src/types.ts tools/create-rhitta/src/params.ts tools/create-rhitta/test/params.test.ts
rtk proxy git commit -m "feat(cli): param sanitization + bundle-id validation"
```

---

## Task 3: Source resolver — local (git archive) + remote (tiged)

**Files:**
- Create: `tools/create-rhitta/src/source.ts`
- Test: `tools/create-rhitta/test/source.test.ts`

- [ ] **Step 1: Write the failing test** (only the local backend is unit-tested; remote hits the network and is covered by the Task 9 e2e). Create `tools/create-rhitta/test/source.test.ts`:

```ts
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveSource } from '../src/source.js'

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
})

function makeGitRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'cr-src-'))
  cleanups.push(dir)
  execFileSync('git', ['init', '-q'], { cwd: dir })
  execFileSync('git', ['config', 'user.email', 't@t.t'], { cwd: dir })
  execFileSync('git', ['config', 'user.name', 't'], { cwd: dir })
  writeFileSync(join(dir, 'tracked.txt'), 'hi')
  mkdirSync(join(dir, 'node_modules'))
  writeFileSync(join(dir, 'node_modules', 'junk.txt'), 'junk')
  execFileSync('git', ['add', 'tracked.txt'], { cwd: dir })
  execFileSync('git', ['commit', '-qm', 'init'], { cwd: dir })
  return dir
}

describe('resolveSource (local)', () => {
  it('copies only tracked files into a fresh temp dir', async () => {
    const src = makeGitRepo()
    const out = await resolveSource({ from: src })
    cleanups.push(out)
    expect(existsSync(join(out, 'tracked.txt'))).toBe(true)
    expect(existsSync(join(out, 'node_modules'))).toBe(false)
    expect(existsSync(join(out, '.git'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run, verify failure.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/source.test.ts`
Expected: FAIL (`resolveSource` undefined).

- [ ] **Step 3: Implement.** Create `tools/create-rhitta/src/source.ts`:

```ts
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface ResolveSourceOptions {
  /** Local Rhitta checkout to vendor from (testing path). */
  from?: string
  /** GitHub "owner/repo" for the remote path. */
  repo?: string
  /** Git ref/tag for the remote path. */
  ref?: string
}

const DEFAULT_REPO = 'LeoRedin/rhitta'

/**
 * Materialize a clean copy of the Rhitta tree into a fresh temp directory.
 * Local: `git archive` at HEAD — yields tracked files only (no .git, node_modules, dist).
 * Remote: tiged clones the GitHub ref without git history.
 */
export async function resolveSource(opts: ResolveSourceOptions): Promise<string> {
  const dest = mkdtempSync(join(tmpdir(), 'create-rhitta-'))
  if (opts.from) {
    // `git archive | tar -x` copies exactly the tracked tree at HEAD.
    const tar = execFileSync('git', ['archive', '--format=tar', 'HEAD'], {
      cwd: opts.from,
      maxBuffer: 512 * 1024 * 1024,
    })
    execFileSync('tar', ['-x', '-C', dest], { input: tar, maxBuffer: 512 * 1024 * 1024 })
    return dest
  }
  const { default: tiged } = await import('tiged')
  const repo = opts.repo ?? DEFAULT_REPO
  const src = opts.ref ? `${repo}#${opts.ref}` : repo
  await tiged(src, { cache: false, force: true, verbose: false }).clone(dest)
  return dest
}
```

- [ ] **Step 4: Run, verify pass.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/source.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
cd /Users/redin/Projects/personal/rhitta
git add tools/create-rhitta/src/source.ts tools/create-rhitta/test/source.test.ts
rtk proxy git commit -m "feat(cli): source resolver (local git-archive + remote tiged)"
```

---

## Task 4: Strip Rhitta-internal artifacts (TDD)

**Files:**
- Create: `tools/create-rhitta/src/strip.ts`
- Test: `tools/create-rhitta/test/strip.test.ts`

- [ ] **Step 1: Write the failing test.** Create `tools/create-rhitta/test/strip.test.ts`:

```ts
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { applyStripList } from '../src/strip.js'

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
})

function fakeTree(): string {
  const root = mkdtempSync(join(tmpdir(), 'cr-strip-'))
  cleanups.push(root)
  mkdirSync(join(root, 'docs', 'handoffs'), { recursive: true })
  mkdirSync(join(root, 'docs', 'adr'), { recursive: true })
  mkdirSync(join(root, 'docs', 'superpowers', 'plans'), { recursive: true })
  mkdirSync(join(root, 'apps', 'mobile', 'scripts'), { recursive: true })
  mkdirSync(join(root, '.changeset'), { recursive: true })
  writeFileSync(join(root, 'docs', 'handoffs', 'h.md'), 'x')
  writeFileSync(join(root, 'docs', 'adr', '0001.md'), 'keep')
  writeFileSync(join(root, 'docs', 'superpowers', 'plans', 'p.md'), 'x')
  writeFileSync(join(root, 'apps', 'mobile', 'scripts', 'rhitta-overlay.sh'), 'x')
  writeFileSync(join(root, 'apps', 'mobile', '.rhitta-overlay-applied'), '0.1.0')
  writeFileSync(join(root, 'CHANGELOG.md'), 'x')
  writeFileSync(join(root, '.changeset', 'config.json'), '{}')
  writeFileSync(join(root, 'CONTEXT.md'), 'keep')
  return root
}

describe('applyStripList', () => {
  it('removes Rhitta-internal artifacts and keeps the rest', () => {
    const root = fakeTree()
    applyStripList(root)
    expect(existsSync(join(root, 'docs', 'handoffs'))).toBe(false)
    expect(existsSync(join(root, 'docs', 'superpowers'))).toBe(false)
    expect(existsSync(join(root, 'apps', 'mobile', 'scripts', 'rhitta-overlay.sh'))).toBe(false)
    expect(existsSync(join(root, 'apps', 'mobile', '.rhitta-overlay-applied'))).toBe(false)
    expect(existsSync(join(root, 'CHANGELOG.md'))).toBe(false)
    // kept:
    expect(existsSync(join(root, 'docs', 'adr', '0001.md'))).toBe(true)
    expect(existsSync(join(root, '.changeset', 'config.json'))).toBe(true)
    expect(existsSync(join(root, 'CONTEXT.md'))).toBe(true)
  })

  it('is idempotent (no throw if a target is already absent)', () => {
    const root = fakeTree()
    applyStripList(root)
    expect(() => applyStripList(root)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run, verify failure.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/strip.test.ts`
Expected: FAIL (`applyStripList` undefined).

- [ ] **Step 3: Implement.** Create `tools/create-rhitta/src/strip.ts`:

```ts
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

/** Paths (relative to tree root) removed wholesale. */
const STRIP_PATHS = [
  '.git',
  'docs/handoffs',
  'docs/superpowers',
  'apps/mobile/scripts/rhitta-overlay.sh',
  'apps/mobile/.rhitta-overlay-applied',
]

/** Workspace roots whose CHANGELOG.md (if present) is Rhitta's release history. */
const CHANGELOG_DIRS = ['', 'apps/api', 'apps/web', 'apps/mobile']

export function applyStripList(root: string): void {
  for (const rel of STRIP_PATHS) {
    rmSync(join(root, rel), { recursive: true, force: true })
  }
  // Root + per-app CHANGELOG.md, plus every packages/* and tools/* CHANGELOG.md.
  const dynamicChangelogDirs = [...CHANGELOG_DIRS]
  for (const parent of ['packages', 'tools']) {
    const abs = join(root, parent)
    if (!existsSync(abs)) continue
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (entry.isDirectory()) dynamicChangelogDirs.push(`${parent}/${entry.name}`)
    }
  }
  for (const dir of dynamicChangelogDirs) {
    rmSync(join(root, dir, 'CHANGELOG.md'), { force: true })
  }
}
```

- [ ] **Step 4: Run, verify pass.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/strip.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
cd /Users/redin/Projects/personal/rhitta
git add tools/create-rhitta/src/strip.ts tools/create-rhitta/test/strip.test.ts
rtk proxy git commit -m "feat(cli): strip Rhitta-internal artifacts from vendored tree"
```

---

## Task 5: Rewrite project identifiers (targeted, file-specific) (TDD)

**Files:**
- Create: `tools/create-rhitta/src/rewrite.ts`
- Test: `tools/create-rhitta/test/rewrite.test.ts`

This is the riskiest module — it must NOT do a global `rhitta`→slug sweep (that would corrupt `@rhitta/*` deps, ADR text, comments). Each edit is anchored to a specific file + token (see the authoritative map in "Critical context").

- [ ] **Step 1: Write the failing test.** Create `tools/create-rhitta/test/rewrite.test.ts`:

```ts
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { rewriteIdentifiers } from '../src/rewrite.js'
import type { ScaffoldParams } from '../src/types.js'

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
})

const PARAMS: ScaffoldParams = {
  targetDir: 'out',
  appName: 'Acme',
  slug: 'acme',
  encoreId: 'acme',
  scheme: 'acme',
  bundleId: 'com.acme.app',
}

function tree(): string {
  const root = mkdtempSync(join(tmpdir(), 'cr-rw-'))
  cleanups.push(root)
  mkdirSync(join(root, 'apps', 'api'), { recursive: true })
  mkdirSync(join(root, 'apps', 'mobile', 'scripts'), { recursive: true })
  mkdirSync(join(root, 'apps', 'web', 'scripts'), { recursive: true })
  mkdirSync(join(root, 'packages', 'contracts'), { recursive: true })
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'rhitta', version: '0.0.0' }, null, 2))
  writeFileSync(join(root, 'apps', 'api', 'encore.app'), JSON.stringify({ id: 'rhitta', lang: 'typescript' }, null, 2))
  writeFileSync(join(root, 'apps', 'api', '.env.example'), 'PORT=4000\nS3_BUCKET=rhitta\n')
  writeFileSync(
    join(root, 'apps', 'mobile', 'app.json'),
    JSON.stringify(
      { name: 'mobile', slug: 'mobile', scheme: 'rhitta', android: { package: 'com.rhitta.app' }, ios: { bundleIdentifier: 'com.rhitta.app' } },
      null,
      2,
    ),
  )
  writeFileSync(
    join(root, 'apps', 'mobile', 'package.json'),
    JSON.stringify({ name: '@rhitta/mobile', scripts: { 'test:maestro': 'maestro test -e MAESTRO_APP_ID=com.rhitta.app .maestro/flows' } }, null, 2),
  )
  writeFileSync(join(root, 'apps', 'mobile', 'scripts', 'gen-api-client.sh'), 'APP_ID="rhitta"\n')
  writeFileSync(join(root, 'apps', 'web', 'scripts', 'gen-api-client.sh'), 'APP_ID="rhitta"\n')
  writeFileSync(join(root, 'packages', 'contracts', 'package.json'), JSON.stringify({ name: '@rhitta/contracts' }, null, 2))
  return root
}

describe('rewriteIdentifiers', () => {
  it('rewrites exactly the project identifiers', () => {
    const root = tree()
    rewriteIdentifiers(root, PARAMS)
    expect(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name).toBe('acme')
    expect(JSON.parse(readFileSync(join(root, 'apps/api/encore.app'), 'utf8')).id).toBe('acme')
    expect(readFileSync(join(root, 'apps/api/.env.example'), 'utf8')).toContain('S3_BUCKET=acme')
    const appJson = JSON.parse(readFileSync(join(root, 'apps/mobile/app.json'), 'utf8'))
    expect(appJson.name).toBe('Acme')
    expect(appJson.slug).toBe('acme')
    expect(appJson.scheme).toBe('acme')
    expect(appJson.android.package).toBe('com.acme.app')
    expect(appJson.ios.bundleIdentifier).toBe('com.acme.app')
    const mobilePkg = JSON.parse(readFileSync(join(root, 'apps/mobile/package.json'), 'utf8'))
    expect(mobilePkg.scripts['test:maestro']).toContain('MAESTRO_APP_ID=com.acme.app')
    expect(readFileSync(join(root, 'apps/mobile/scripts/gen-api-client.sh'), 'utf8')).toContain('APP_ID="acme"')
    expect(readFileSync(join(root, 'apps/web/scripts/gen-api-client.sh'), 'utf8')).toContain('APP_ID="acme"')
  })

  it('does NOT touch @rhitta/* package namespaces', () => {
    const root = tree()
    rewriteIdentifiers(root, PARAMS)
    expect(JSON.parse(readFileSync(join(root, 'apps/mobile/package.json'), 'utf8')).name).toBe('@rhitta/mobile')
    expect(JSON.parse(readFileSync(join(root, 'packages/contracts/package.json'), 'utf8')).name).toBe('@rhitta/contracts')
  })
})
```

- [ ] **Step 2: Run, verify failure.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/rewrite.test.ts`
Expected: FAIL (`rewriteIdentifiers` undefined).

- [ ] **Step 3: Implement.** Create `tools/create-rhitta/src/rewrite.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ScaffoldParams } from './types.js'

/** Read JSON, mutate via fn, write back with 2-space indent + trailing newline. */
function editJson(path: string, fn: (json: Record<string, unknown>) => void): void {
  const json = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  fn(json)
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`)
}

/** Replace the FIRST occurrence of `needle` with `value` in a text file. */
function replaceOnce(path: string, needle: string, value: string): void {
  const text = readFileSync(path, 'utf8')
  const idx = text.indexOf(needle)
  if (idx === -1) {
    throw new Error(`Expected to find "${needle}" in ${path} but did not.`)
  }
  writeFileSync(path, text.slice(0, idx) + value + text.slice(idx + needle.length))
}

export function rewriteIdentifiers(root: string, p: ScaffoldParams): void {
  editJson(join(root, 'package.json'), (j) => {
    j.name = p.slug
  })

  editJson(join(root, 'apps/api/encore.app'), (j) => {
    j.id = p.encoreId
  })

  replaceOnce(join(root, 'apps/api/.env.example'), 'S3_BUCKET=rhitta', `S3_BUCKET=${p.slug}`)

  editJson(join(root, 'apps/mobile/app.json'), (j) => {
    j.name = p.appName
    j.slug = p.slug
    j.scheme = p.scheme
    const android = j.android as Record<string, unknown> | undefined
    if (android) android.package = p.bundleId
    const ios = j.ios as Record<string, unknown> | undefined
    if (ios) ios.bundleIdentifier = p.bundleId
  })

  editJson(join(root, 'apps/mobile/package.json'), (j) => {
    const scripts = j.scripts as Record<string, string> | undefined
    if (scripts?.['test:maestro']) {
      scripts['test:maestro'] = scripts['test:maestro'].replace(
        'MAESTRO_APP_ID=com.rhitta.app',
        `MAESTRO_APP_ID=${p.bundleId}`,
      )
    }
  })

  for (const rel of ['apps/mobile/scripts/gen-api-client.sh', 'apps/web/scripts/gen-api-client.sh']) {
    replaceOnce(join(root, rel), 'APP_ID="rhitta"', `APP_ID="${p.encoreId}"`)
  }
}
```

- [ ] **Step 4: Run, verify pass.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/rewrite.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Commit.**
```bash
cd /Users/redin/Projects/personal/rhitta
git add tools/create-rhitta/src/rewrite.ts tools/create-rhitta/test/rewrite.test.ts
rtk proxy git commit -m "feat(cli): targeted project-identifier rewrite"
```

---

## Task 6: Generate the project README (TDD)

**Files:**
- Create: `tools/create-rhitta/src/readme.ts`
- Test: `tools/create-rhitta/test/readme.test.ts`

- [ ] **Step 1: Write the failing test.** Create `tools/create-rhitta/test/readme.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { renderReadme } from '../src/readme.js'
import type { ScaffoldParams } from '../src/types.js'

const PARAMS: ScaffoldParams = {
  targetDir: 'out',
  appName: 'Acme',
  slug: 'acme',
  encoreId: 'acme',
  scheme: 'acme',
  bundleId: 'com.acme.app',
}

describe('renderReadme', () => {
  it('uses the app name as the title and mentions the three apps + validate', () => {
    const md = renderReadme(PARAMS)
    expect(md.startsWith('# Acme')).toBe(true)
    expect(md).toContain('pnpm install')
    expect(md).toContain('pnpm validate')
    expect(md).toContain('apps/api')
    expect(md).toContain('apps/web')
    expect(md).toContain('apps/mobile')
    expect(md).toContain('AGENTS.md')
  })
  it('does not leak the name "Rhitta" as the project title', () => {
    expect(renderReadme(PARAMS).startsWith('# Rhitta')).toBe(false)
  })
})
```

- [ ] **Step 2: Run, verify failure.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/readme.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement.** Create `tools/create-rhitta/src/readme.ts`:

```ts
import type { ScaffoldParams } from './types.js'

export function renderReadme(p: ScaffoldParams): string {
  return `# ${p.appName}

Bootstrapped with [Rhitta](https://github.com/LeoRedin/rhitta) — an opinionated,
convention-enforced monorepo for API + web + mobile.

## Setup

\`\`\`bash
nvm use
corepack enable
pnpm install
pnpm validate   # lint + typecheck + structure validation
\`\`\`

## Workspaces

- \`apps/api\` — Encore.ts service (Postgres + Better Auth).
- \`apps/web\` — TanStack Start SSR client.
- \`apps/mobile\` — Expo / React Native app (run \`pnpm --filter @rhitta/mobile prebuild:clean\` to materialize native projects).
- \`packages/*\` — shared contracts, design tokens, and config.

## Conventions

The operating manual lives in [\`AGENTS.md\`](./AGENTS.md); architectural decisions in
[\`docs/adr/\`](./docs/adr/). The structure validator (\`pnpm structure:validate\`) enforces
them on every commit.
`
}
```

- [ ] **Step 4: Run, verify pass.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta exec vitest run test/readme.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
cd /Users/redin/Projects/personal/rhitta
git add tools/create-rhitta/src/readme.ts tools/create-rhitta/test/readme.test.ts
rtk proxy git commit -m "feat(cli): generated project README"
```

---

## Task 7: Prompts (clack) + flag parsing

**Files:**
- Create: `tools/create-rhitta/src/prompts.ts`

No unit test (interactive I/O). Verified via the Task 9 e2e using flags (non-interactive path).

- [ ] **Step 1: Implement.** Create `tools/create-rhitta/src/prompts.ts`:

```ts
import { cancel, confirm, intro, isCancel, outro, text } from '@clack/prompts'
import { buildParams, isValidBundleId } from './params.js'
import type { RawFlags, ScaffoldParams } from './types.js'

/** Parse argv (after `node index.js`) into RawFlags. First non-flag arg is the dir. */
export function parseFlags(argv: string[]): RawFlags {
  const flags: RawFlags = { install: true, git: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--no-install') flags.install = false
    else if (a === '--no-git') flags.git = false
    else if (a === '--name') flags.name = argv[++i]
    else if (a === '--bundle-id') flags.bundleId = argv[++i]
    else if (a === '--from') flags.from = argv[++i]
    else if (a === '--ref') flags.ref = argv[++i]
    else if (!a.startsWith('-') && flags.dir === undefined) flags.dir = a
  }
  return flags
}

function exitIfCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Scaffolding cancelled.')
    process.exit(1)
  }
  return value as T
}

/** Fill any missing fields interactively, then build validated ScaffoldParams. */
export async function collectParams(flags: RawFlags): Promise<ScaffoldParams> {
  intro('create-rhitta')

  const dir =
    flags.dir ??
    exitIfCancel(
      await text({
        message: 'Project directory?',
        placeholder: 'my-app',
        validate: (v) => (v.trim().length === 0 ? 'Required' : undefined),
      }),
    )

  const name =
    flags.name ??
    exitIfCancel(
      await text({
        message: 'App display name?',
        placeholder: dir,
        defaultValue: dir,
      }),
    )

  const bundleId =
    flags.bundleId ??
    exitIfCancel(
      await text({
        message: 'Mobile bundle id (reverse-DNS)?',
        placeholder: 'com.acme.app',
        validate: (v) => (isValidBundleId(v) ? undefined : 'Use reverse-DNS, e.g. com.acme.app'),
      }),
    )

  outro('Scaffolding…')
  return buildParams({ dir, name, bundleId })
}

export async function confirmInstall(): Promise<boolean> {
  const ok = await confirm({ message: 'Install dependencies now?' })
  return exitIfCancel(ok)
}
```

- [ ] **Step 2: Typecheck.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta typecheck`
Expected: passes.

- [ ] **Step 3: Commit.**
```bash
cd /Users/redin/Projects/personal/rhitta
git add tools/create-rhitta/src/prompts.ts
rtk proxy git commit -m "feat(cli): clack prompts + flag parsing"
```

---

## Task 8: Post steps + CLI entry orchestration

**Files:**
- Create: `tools/create-rhitta/src/post.ts`
- Modify: `tools/create-rhitta/src/index.ts` (replace the stub)

- [ ] **Step 1: Implement `post.ts`.** Create `tools/create-rhitta/src/post.ts`:

```ts
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderReadme } from './readme.js'
import type { ScaffoldParams } from './types.js'

/** Move the transformed temp tree into the target dir, write README, git init, install. */
export function finalize(
  tempTree: string,
  params: ScaffoldParams,
  opts: { install: boolean; git: boolean },
): string {
  const target = resolve(process.cwd(), params.targetDir)
  if (existsSync(target)) {
    throw new Error(`Target directory already exists: ${target}`)
  }
  cpSync(tempTree, target, { recursive: true })
  rmSync(tempTree, { recursive: true, force: true })

  writeFileSync(resolve(target, 'README.md'), renderReadme(params))

  if (opts.git) {
    execFileSync('git', ['init', '-q'], { cwd: target })
  }
  if (opts.install) {
    execFileSync('pnpm', ['install'], { cwd: target, stdio: 'inherit' })
  }
  return target
}
```

- [ ] **Step 2: Implement `index.ts`.** Replace `tools/create-rhitta/src/index.ts` with:

```ts
#!/usr/bin/env node
import { log } from '@clack/prompts'
import { collectParams, parseFlags } from './prompts.js'
import { resolveSource } from './source.js'
import { applyStripList } from './strip.js'
import { rewriteIdentifiers } from './rewrite.js'
import { finalize } from './post.js'

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2))
  const params = await collectParams(flags)

  const tree = await resolveSource({ from: flags.from, ref: flags.ref })
  applyStripList(tree)
  rewriteIdentifiers(tree, params)
  const target = finalize(tree, params, { install: flags.install, git: flags.git })

  log.success(`Created ${params.appName} at ${target}`)
  log.info('Next: cd in, then `pnpm validate`. For mobile native projects run `pnpm --filter @rhitta/mobile prebuild:clean`.')
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`create-rhitta failed: ${msg}`)
  process.exit(1)
})
```

- [ ] **Step 3: Build + typecheck.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta build && pnpm --filter create-rhitta typecheck`
Expected: both pass; `dist/index.js` emitted.

- [ ] **Step 4: Commit.**
```bash
cd /Users/redin/Projects/personal/rhitta
git add tools/create-rhitta/src/post.ts tools/create-rhitta/src/index.ts
rtk proxy git commit -m "feat(cli): post-steps + CLI orchestration entrypoint"
```

---

## Task 9: End-to-end — scaffold from local source and prove the output is healthy

**Files:** none (verification + a temp scaffold); optionally a committed smoke script.

This is the real proof: vendor THIS repo into a temp project via `--from`, non-interactive, and run the generated project's own gate.

- [ ] **Step 1: Build the CLI.**
Run: `cd /Users/redin/Projects/personal/rhitta && pnpm --filter create-rhitta build`
Expected: `dist/index.js` present.

- [ ] **Step 2: Scaffold a throwaway project from the local checkout (no install yet — faster first check).**
```bash
cd /Users/redin/Projects/personal/rhitta
TMP=$(mktemp -d)
node tools/create-rhitta/dist/index.js "$TMP/acme" --name "Acme" --bundle-id com.acme.app --from /Users/redin/Projects/personal/rhitta --no-install --no-git
```
Expected: completes with "Created Acme…".

- [ ] **Step 3: Verify the vendored tree is correct.**
```bash
# identifiers rewritten:
node -e "const p=require('$TMP/acme/package.json'); if(p.name!=='acme') throw new Error('root name='+p.name)"
node -e "const a=require('$TMP/acme/apps/mobile/app.json'); if(a.android.package!=='com.acme.app'||a.scheme!=='acme'||a.slug!=='acme') throw new Error('mobile ids wrong')"
node -e "const e=require('$TMP/acme/apps/api/encore.app'); if(e.id!=='acme') throw new Error('encore id='+e.id)"
grep -q 'APP_ID="acme"' "$TMP/acme/apps/web/scripts/gen-api-client.sh" || { echo 'web APP_ID not rewritten'; exit 1; }
# @rhitta scope preserved:
node -e "const m=require('$TMP/acme/apps/mobile/package.json'); if(m.name!=='@rhitta/mobile') throw new Error('namespace changed: '+m.name)"
# strip worked:
test ! -d "$TMP/acme/docs/handoffs" || { echo 'handoffs not stripped'; exit 1; }
test ! -d "$TMP/acme/docs/superpowers" || { echo 'superpowers not stripped'; exit 1; }
test ! -f "$TMP/acme/apps/mobile/scripts/rhitta-overlay.sh" || { echo 'overlay not stripped'; exit 1; }
# kept:
test -d "$TMP/acme/docs/adr" || { echo 'adr missing'; exit 1; }
test -f "$TMP/acme/CONTEXT.md" || { echo 'CONTEXT missing'; exit 1; }
# README regenerated:
head -1 "$TMP/acme/README.md" | grep -q '^# Acme' || { echo 'README not regenerated'; exit 1; }
echo "TREE_OK"
```
Expected: `TREE_OK`.

- [ ] **Step 4: Install + run the generated project's full gate (the decisive proof).**
```bash
cd "$TMP/acme"
rtk proxy pnpm install
pnpm validate
```
Expected: the vendored project's own `pnpm validate` passes (lint + per-package validate + structure-validate) — proving the scaffold output is a healthy, convention-clean Rhitta project. If structure-validate fails on the vendored tree, the rewrite/strip left it inconsistent — diagnose and fix the relevant module before completing. If `pnpm install` fails because `create-rhitta` itself was vendored into `tools/` and references workspace deps oddly, note it: `create-rhitta` IS part of the vendored tree (it's under `tools/`), which is acceptable for v0 — the downstream simply carries the CLI too. (If we later decide to strip `tools/create-rhitta` from scaffolds, add it to the strip list — but that is a separate decision, not part of this plan.)

- [ ] **Step 5: Clean up the throwaway.**
```bash
rm -rf "$TMP"
```

- [ ] **Step 6: (Optional) record results.** No commit needed unless Step 4 surfaced a fix in `tools/create-rhitta/**` — in that case commit it with `fix(cli): …`.

---

## Self-Review

- **Spec coverage (against grilled decisions):** public unscoped `create-rhitta` ✓ (Task 1); vendored all three apps ✓ (source resolver copies whole tree, Task 3); `@clack/prompts` + non-interactive flags ✓ (Task 7); degit-tag remote + `--from` local ✓ (Task 3, `tiged`); keep `@rhitta/*`, root name = slug ✓ (Task 5 + its negative test); strip handoffs/superpowers/overlay/changelogs, keep adr/CONTEXT/structure-validator, replace README ✓ (Tasks 4 + 6); independent version + ADR-0027 ✓ (Task 1); structure-validator exception for the unscoped name ✓ (Task 1 Step 4); managed-workflow mobile (no ignite, downstream prebuild) ✓ (documented, README note). E2E proves the output passes its own gate ✓ (Task 9).
- **Placeholder scan:** every step has literal code or an exact command + expected output. The only deliberately-deferred item (whether to strip `tools/create-rhitta` from scaffolds) is explicitly flagged as out of scope, not a TODO inside code.
- **Type/name consistency:** `ScaffoldParams`/`RawFlags` defined once (Task 2) and imported everywhere; function names (`resolveSource`, `applyStripList`, `rewriteIdentifiers`, `renderReadme`, `finalize`, `collectParams`, `parseFlags`) are used consistently across tasks; the identifier-rewrite test fixtures mirror the real files (`encore.app`, `app.json`, `gen-api-client.sh`) verified against the repo during planning.

## Known open question for after v0

Should the scaffolded project itself carry `tools/create-rhitta`? Right now it does (it's vendored with the rest of `tools/`). Harmless, but arguably noise in a downstream product repo. Defer: if we strip it, add `tools/create-rhitta` to `STRIP_PATHS` in `src/strip.ts` and update its test. Flagged in Task 9 Step 4.
