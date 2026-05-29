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
