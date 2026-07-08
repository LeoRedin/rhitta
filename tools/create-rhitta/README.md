# create-rhitta

Scaffold a new [Rhitta](https://github.com/LeoRedin/rhitta) project.

```bash
npm create rhitta@latest my-app
# or: pnpm create rhitta my-app
# or: npx create-rhitta my-app
```

The CLI vendors the Rhitta monorepo (the apps you choose + packages + tools), rewrites the
project identifiers you provide, and leaves you a ready-to-build workspace.

## App selection

Rhitta ships three apps: `api` (Encore.ts backend, **always included**), `web` (TanStack
Start SSR), and `mobile` (Expo / React Native). Choose which to scaffold.

Run without any selection flag and the CLI prompts a multiselect (all three default-on,
`api` locked in). Any deselected app is pruned completely — its `apps/<app>` directory, its
exclusive `packages/design-system-<app>`, its `dev:<app>` script, and its structure-validator
entries — so the result installs, builds, lints, and validates with no manual cleanup.

Select non-interactively with `--apps` (an allowlist) and/or `--no-*`:

```bash
pnpm create rhitta my-app --apps api,mobile      # api + mobile only
pnpm create rhitta my-app --no-web               # drop the web app
pnpm create rhitta my-app --apps api             # api only
```

The mobile bundle id is only required (and only prompted) when `mobile` is included.

## Flags

| Flag | Meaning |
|------|---------|
| `<dir>` | Target directory (positional). Prompted if omitted. |
| `--name <s>` | App display name. |
| `--bundle-id <s>` | Mobile reverse-DNS bundle id (e.g. `com.acme.app`). Required only with `mobile`. |
| `--apps <list>` | Comma-separated allowlist of apps to include (e.g. `api,mobile`). `api` is always included. |
| `--no-web` | Exclude the `web` app. |
| `--no-mobile` | Exclude the `mobile` app. |
| `--from <path>` | Vendor from a local Rhitta checkout instead of GitHub (testing). |
| `--ref <git-ref>` | GitHub ref/tag to vendor from (default: latest release). |
| `--no-install` | Skip dependency install. |
| `--no-git` | Skip `git init`. |
