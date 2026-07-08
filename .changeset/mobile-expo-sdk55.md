---
"create-rhitta": patch
---

Reconcile the vendored `apps/mobile` dependency set to one coherent Expo SDK 55.
`expo-router` is bumped from `^4.0.0` (SDK 52-era) to `^55.0.16`; this drops the
transitive `react-helmet-async@1.3.0` and `@radix-ui/react-slot@1.0.1` packages, which
pinned React ≤18 and conflicted with the installed React 19. `expo-secure-store` and the
remaining Expo packages are aligned to their SDK-55 versions. `pnpm install` on a
scaffolded mobile app no longer emits unmet-peer warnings.
