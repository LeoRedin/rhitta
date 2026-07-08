# ADR 0028: create-rhitta selectable apps

## Status
Accepted

## Context
`create-rhitta` (ADR-0027) vendors the full Rhitta tree — all three apps (`api`, `web`,
`mobile`) — unconditionally. But not every product wants every surface. The first
downstream consumer, **A Dois**, is mobile-only and had to hand-drop the web surface after
scaffolding: delete `apps/web` + `packages/design-system-web`, trim the structure-validator
variant maps, and remove the `dev:web` root script (recorded in that repo's own
ADR-0028). That manual pruning is exactly the class of work the scaffolder should automate,
and "select which apps to scaffold" was already on the roadmap.

Two things made this low-risk to add. First, `web` and `mobile` each own an exclusive
design-system package (`design-system-web`, `design-system-mobile`) that nothing else
depends on, so an app and its design system prune as a self-contained pair with no dangling
workspace deps. Second, the structure validator already iterates the *real* workspaces on
disk and its web/mobile route checks vacuously pass when those directories are absent — so a
pruned tree validates without any validator logic change. `pnpm-workspace.yaml` uses globs,
and the `.changeset` config keys on the `@rhitta/*` glob, so neither needs editing either.

## Decision
`create-rhitta` gains app selection. `api` is mandatory (the backend); `web` and `mobile`
are independent toggles, default-on.

- **Interactive:** a multiselect (`api` shown but forced on) after the name prompt. The
  mobile bundle-id prompt is asked only when `mobile` is selected, and a summary-confirm
  precedes scaffolding.
- **Non-interactive:** `--apps <list>` (allowlist, e.g. `--apps api,mobile`) and/or
  `--no-web` / `--no-mobile`. Any selection flag suppresses the prompts; `api` is always
  forced in. Passing a selection flag is the signal that the run is non-interactive.
- **Pruning engine** (`prune.ts`, run after strip and before rewrite): for each deselected
  optional app it removes `apps/<app>`, the exclusive `packages/design-system-<app>`, the
  root `dev:<app>` script, and the app's entries in `TSCONFIG_VARIANT_MAP` /
  `BIOME_VARIANT_MAP`. The identifier rewrite and README generation are selection-aware.
- **Deliberately kept:** the shared config variants (`@rhitta/tsconfig/web.json`,
  `@rhitta/biome-config/web-app`, and mobile equivalents) — they cost nothing and make
  re-adding an app low-friction.

No structure-validator logic change was required; the variant-map trimming is for tidiness,
not correctness.

## Consequences
- Every combination (`api`, `api+web`, `api+mobile`, `api+web+mobile`) scaffolds to a tree
  that passes `pnpm install && pnpm build && pnpm lint && pnpm validate` with no manual edits.
- Re-adding a dropped app later means restoring its `apps/<app>` +
  `packages/design-system-<app>` and its two variant-map entries — the retained shared config
  variants keep this friction low. There is no automated "add an app back" codemod.
- The scaffolder now owns knowledge of which packages are exclusive to which app. A future
  fourth surface must be wired into `prune.ts`, the multiselect, and README generation.
