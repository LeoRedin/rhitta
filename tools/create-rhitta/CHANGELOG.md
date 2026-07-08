# create-rhitta

## 0.2.0

### Minor Changes

- [`643461e`](https://github.com/LeoRedin/rhitta/commit/643461ee23efba68f75370af6db8a803d9526fd9) Thanks [@LeoRedin](https://github.com/LeoRedin)! - Add app selection. `api` is always scaffolded; `web` and `mobile` are now independent,
  default-on choices. Run interactively for a multiselect (plus a summary confirm, and a
  mobile bundle-id prompt only when mobile is chosen), or select non-interactively with
  `--apps <list>` (allowlist) and/or `--no-web` / `--no-mobile`.

  Every deselected app is pruned completely — its `apps/<app>` directory, its exclusive
  `packages/design-system-<app>`, its `dev:<app>` root script, and its structure-validator
  variant-map entries — so `api`, `api+web`, `api+mobile`, and `api+web+mobile` each scaffold
  to a project that installs, builds, lints, and validates with zero manual edits. Shared
  config variants (`@rhitta/tsconfig/web.json`, `@rhitta/biome-config/web-app`, and mobile
  equivalents) are retained to keep re-adding an app low-friction. See ADR-0028.

### Patch Changes

- [`3809dfb`](https://github.com/LeoRedin/rhitta/commit/3809dfb32c5f7fd7774cd972d87b3b05d4420188) Thanks [@LeoRedin](https://github.com/LeoRedin)! - Reconcile the vendored `apps/mobile` dependency set to one coherent Expo SDK 55.
  `expo-router` is bumped from `^4.0.0` (SDK 52-era) to `^55.0.16`; this drops the
  transitive `react-helmet-async@1.3.0` and `@radix-ui/react-slot@1.0.1` packages, which
  pinned React ≤18 and conflicted with the installed React 19. `expo-secure-store` and the
  remaining Expo packages are aligned to their SDK-55 versions. `pnpm install` on a
  scaffolded mobile app no longer emits unmet-peer warnings.

- [`b16640f`](https://github.com/LeoRedin/rhitta/commit/b16640fa61ef9bac61dfe0ae7c1d70a8f052777a) Thanks [@LeoRedin](https://github.com/LeoRedin)! - Keep the scaffolded `apps/mobile/app.json` Biome-formatted. The identifier rewrite
  previously re-serialized the file with `JSON.stringify`, which expanded short arrays
  like `"assetBundlePatterns": ["**/*"]` onto multiple lines — making a fresh scaffold
  fail `pnpm lint` until the user ran `pnpm format`. The rewrite now edits the values in
  place, preserving the file's Biome-clean formatting, so a fresh scaffold lints clean
  with no manual formatting step.

- [`5a7527d`](https://github.com/LeoRedin/rhitta/commit/5a7527d5ecca9ef500cf1d01821879cdea2168bc) Thanks [@LeoRedin](https://github.com/LeoRedin)! - Document the `.tool-versions` Node pin expectation in the generated README: the pinned
  Node patch is derived from `.nvmrc` and is a real published release, so if `asdf install`
  reports it as not found the user's plugin index is stale and should be updated with
  `asdf plugin update nodejs`.
