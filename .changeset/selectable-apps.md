---
"create-rhitta": minor
---

Add app selection. `api` is always scaffolded; `web` and `mobile` are now independent,
default-on choices. Run interactively for a multiselect (plus a summary confirm, and a
mobile bundle-id prompt only when mobile is chosen), or select non-interactively with
`--apps <list>` (allowlist) and/or `--no-web` / `--no-mobile`.

Every deselected app is pruned completely — its `apps/<app>` directory, its exclusive
`packages/design-system-<app>`, its `dev:<app>` root script, and its structure-validator
variant-map entries — so `api`, `api+web`, `api+mobile`, and `api+web+mobile` each scaffold
to a project that installs, builds, lints, and validates with zero manual edits. Shared
config variants (`@rhitta/tsconfig/web.json`, `@rhitta/biome-config/web-app`, and mobile
equivalents) are retained to keep re-adding an app low-friction. See ADR-0028.
