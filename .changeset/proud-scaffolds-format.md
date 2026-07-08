---
"create-rhitta": patch
---

Keep the scaffolded `apps/mobile/app.json` Biome-formatted. The identifier rewrite
previously re-serialized the file with `JSON.stringify`, which expanded short arrays
like `"assetBundlePatterns": ["**/*"]` onto multiple lines — making a fresh scaffold
fail `pnpm lint` until the user ran `pnpm format`. The rewrite now edits the values in
place, preserving the file's Biome-clean formatting, so a fresh scaffold lints clean
with no manual formatting step.
