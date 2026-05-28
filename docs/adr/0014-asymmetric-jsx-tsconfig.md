# ADR 0014: Asymmetric JSX transform across web and mobile tsconfigs

## Status
Accepted

## Context
`@rhitta/tsconfig` ships four variants (`base`, `node`, `web`, `mobile`) per ADR-0006 / general convention. Two of them deal with JSX: `web` (Vite-bundled, TanStack Start) and `mobile` (Metro-bundled, React Native + Ignite). They could share a single JSX strategy or diverge.

Three JSX strategies exist in TS 5+ / TS 6:
- `preserve` — TypeScript emits `.jsx` files unchanged; the downstream bundler transforms JSX.
- `react-jsx` — TypeScript emits runtime calls (`jsx(_jsx)`) directly, no React import needed in source.
- `react` — legacy `React.createElement` calls. Not a serious option in 2026.

Each bundler has a preferred input:
- **Vite + esbuild + SWC (TanStack Start's pipeline)** expects raw JSX — `preserve` is idiomatic. With `react-jsx`, esbuild re-transforms TypeScript-emitted runtime calls; works but pointless extra step.
- **Metro (React Native)** parses TypeScript directly via Babel + `@babel/preset-react`. Modern Metro handles `preserve` output, but `react-jsx` is what every Ignite-shaped project ships and what Babel's `automatic` runtime aligns with.

Symmetry is appealing — same `jsx` on both keeps mental models small. But neither single choice is correct for both targets:
- `preserve` on mobile *works* but contradicts every Ignite template and most Metro tooling assumptions.
- `react-jsx` on web *works* but produces double-transformed output.

The cost of asymmetry is one line of documentation. The cost of forced symmetry is recurring confusion when builds break in non-obvious ways.

## Decision
- `@rhitta/tsconfig/web.json` sets `"jsx": "preserve"`.
- `@rhitta/tsconfig/mobile.json` sets `"jsx": "react-jsx"`.

Both variants share everything else: strict mode, `verbatimModuleSyntax`, `isolatedModules`, Bundler resolution. The JSX strategy is the only intentional divergence.

`AGENTS.md` (and this ADR) document the asymmetry once. New web/mobile workspaces extend the correct variant and never set `jsx` themselves.

## Consequences
- **Each platform uses its native idiom.** Vite sees raw JSX; Metro sees runtime calls. No double-transform on web; no Ignite-template surprises on mobile.
- **Cost: asymmetric configs.** One line of documentation pays for itself the first time someone wonders why.
- **Cross-platform component shape unchanged.** The asymmetry is in the *compile step*, not the source. Components in `@rhitta/design-system-web` and `@rhitta/design-system-mobile` write JSX the same way; the bundler chain differs.
- **If TanStack Start ever ships a Vite plugin that prefers `react-jsx` input** (or Metro reverses defaults), revisit. Not expected in 2026.
