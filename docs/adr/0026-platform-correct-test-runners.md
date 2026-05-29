# ADR 0026: Platform-correct test runners

## Status
Accepted

## Context
A post-Phase-2c audit found `apps/mobile` runs `jest-expo`, not Vitest — despite the
Phase 2c handoff claiming Vitest. `apps/web` and `apps/api` use Vitest. The question was
whether to force Vitest onto mobile for uniformity (AGENTS.md rule 1, "one way to do
everything").

React Native testing under Vitest is unsupported in practice: there is no blessed
Vitest RN preset, RN ships untranspiled Flow/TS, and the existing mobile tests are
jest-coupled (`@jest/globals`, `jest.doMock('react-native', …)`, `react-test-renderer`,
`@testing-library/react-native`). `jest-expo` exists precisely to solve this.

Rule 1 forbids two solutions to *the same* problem. Web/SSR testing and React Native
testing are *different* problems with different ecosystem-correct tools.

## Decision
Mobile tests run on `jest-expo`. Web and API tests run on Vitest. This split is
deliberate and permanent for v0: each platform uses its ecosystem's correct runner.
No structure-validator check mandates a single runner; the enforced conventions are
Biome (lint/format) and the structure validator, both of which mobile honors.

Reactotron is retained as the mobile dev tool (`__DEV__`-gated). dependency-cruiser is
removed: it duplicated boundary enforcement already provided by the structure validator
and Biome `noRestrictedImports`.

## Consequences
- Mobile keeps `jest`, `jest-expo`, `@testing-library/react-native`, `react-test-renderer`.
- Contributors must not "unify" mobile onto Vitest without superseding this ADR.
- If a shared assertion/util is ever needed across runners, it must be runner-agnostic.
- A future generator (`gen:primitive` for mobile) emits jest-shaped tests on mobile and
  Vitest-shaped tests on web.
