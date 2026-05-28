# ADR 0012: Two-layer token architecture with dual themes from day 1

## Status
Accepted

## Context
A naive design-tokens package exposes one flat layer — raw values like `colors.neutral[700]` or `spacing[4]` — and consumers read them directly in components. This works until two things happen:

1. **Rebranding.** Replacing `colors.brand.primary` is easy; changing what "the muted text color" *means* requires editing every component that hardcoded `colors.neutral[500]`.
2. **Theming.** Adding a dark mode means every component that referenced a primitive value has to learn about themes. The first dark-mode rollout in a single-layer system is a multi-file change with high regression risk.

Both problems are solved by a **two-layer architecture**: primitive tokens for raw values, semantic tokens as named aliases that components actually consume. Components read `semantic.text.muted`, never `colors.neutral[500]`. Rebranding swaps primitives; restyling swaps semantic aliases.

The other open question is **when** to ship dark mode. Shipping it later is cheap *if* the consumer never depended on theme-invariance — but every component built against a single-theme set has to be retrofitted. Shipping it up front is a 2x source-of-truth cost but zero retrofit.

Alternatives considered:
- **Single layer + light only** — fastest now, biggest debt later.
- **Single layer + dual theme** — half-improvement; theming works but rebranding still touches consumers.
- **Two layers + light only** — defers the dark-mode cost without solving its real problem (the retrofit).
- **Two layers + dual theme from day 1** — highest upfront cost, lowest long-term cost.

Rhitta's stated value is "machine-enforced conventions that survive long-term." The boilerplate's value is highest when downstream consumers can rebrand and re-theme without grep-and-replace.

## Decision
Ship `@rhitta/design-tokens` with **two layers** of tokens (primitive + semantic) and **two themes** (light + dark) from Phase 1 onward.

### Layer 1 — Primitive tokens (raw values, never read by components)
Authored in `src/primitive.ts`. ~63 leaves total: colors (brand + neutral 50–950 + semantic), spacing (4px scale, 14 steps), radii (7 steps), typography (fontFamily × fontSize × fontWeight × lineHeight), motion (duration + easing).

### Layer 2 — Semantic tokens (aliases that components consume)
Authored in `src/semantic.ts`. ~20 leaves: `bg.app`, `bg.surface`, `bg.surfaceRaised`, `bg.inverse`, `text.body`, `text.muted`, `text.inverse`, `text.brand`, `text.danger`, `border.default`, `border.strong`, `border.focus`, etc. Each entry has a `light` value and a `dark` value, each referencing a primitive.

### Web consumption (CSS variables + Tailwind v4)
A build script emits two CSS files: `dist/tokens.css` (raw `:root { --color-*: ... }` + `[data-theme="dark"] { --color-*: ... }`) and `dist/theme.css` (a Tailwind v4 `@theme` block aliasing semantic vars). CSS variable names follow Tailwind v4 canonical (`--color-bg-surface`, `--spacing-4`, `--font-sans`); no `--rhitta-*` prefix.

### Mobile consumption (TS constants + Ignite themed)
The same TS source exports both layers as constants. `@rhitta/design-system-mobile` wires an Ignite themed factory that reads semantic tokens by current theme.

### Single source of truth
TS is canonical. A small build script (`scripts/build-css.ts`, no external deps) reads `src/primitive.ts` + `src/semantic.ts` and emits both CSS files at build time. Drift is impossible by construction.

## Consequences
- **Rebranding cost drops to one file** (`src/primitive.ts`). Components don't change.
- **Theme switching is free at runtime.** Web flips `data-theme`; mobile flips the Ignite theme.
- **Cross-platform parity.** Web and mobile read the same semantic tokens; only the consumption mechanism differs.
- **Upfront cost:** ~2x source-of-truth lines vs single-layer. One small build script.
- **Discipline cost:** primitives are *never* read by components. Enforced by code review; can later be enforced by a structure-validator check (`design-system-*/src/**` files may import from `@rhitta/design-tokens/semantic` but not `@rhitta/design-tokens/primitive` — Phase 3 candidate).
- **Override clarity:** consumers who fork Rhitta and want a custom brand replace `src/primitive.ts`. Consumers who want a custom theme palette replace specific entries in `src/semantic.ts`. Two distinct verbs for two distinct intents.
