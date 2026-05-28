# ADR 0022: Radix Primitives (not Themes) as the design-system-web base

## Status
Accepted

## Context
ADR-0006 fixed the three-package design system split (`design-tokens`, `design-system-web`, `design-system-mobile`) and stated `@rhitta/design-system-web` is "Radix-wrapped primitives + Tailwind v4." This ADR concretizes what "Radix" means in that sentence.

Radix ships two product lines:

- **Radix Primitives** — unstyled, accessible React components (Dialog, Popover, Dropdown, etc.). The component owns behavior + ARIA; the consumer owns styling.
- **Radix Themes** — a fully-styled, opinionated component library built on Primitives. Visually expressive, but the theme is the brand — consumers either inherit Radix's visual identity or fight it.

Rhitta's design-tokens layer (ADR-0012) already defines the brand surface (primitives + semantic aliases, light + dark themes). Layering Radix Themes on top would create two competing brand definitions. Consumers would either rebrand twice (override Themes + override tokens) or live with the conflict.

Alternatives considered:
- **Radix Themes**: rich out of the box, but the visual is the boilerplate's most rebrandable surface. Themes makes that rebrand harder.
- **Radix Primitives + Tailwind v4 classes pulling from @rhitta/design-tokens**: each design-system-web primitive (Button, Input, Dialog, etc.) wraps the Radix Primitive with Tailwind classes that read CSS variables emitted by `@rhitta/design-tokens/tailwind`. Brand changes flow through the token layer.
- **Headless UI + Tailwind**: similar shape; Radix's accessibility track record is stronger as of 2026.
- **shadcn/ui copy-paste model**: scaffolds Radix-wrapped components into the consumer's repo. Rhitta does scaffold-at-create-time (per Phase 0 handoff's consumption model), but `design-system-web` itself is a runtime dep, not a copy-paste source.

## Decision
`@rhitta/design-system-web` is built on **Radix Primitives** (unstyled) + Tailwind v4 + `@rhitta/design-tokens`. **Radix Themes is not used** anywhere.

Phase 2b ships 8 primitives:

| Primitive | Radix package(s) | Notes |
|-----------|-------------------|-------|
| `Button` | `@radix-ui/react-slot` | Composition via `asChild`; variants via Tailwind |
| `Input` | (none — wraps native `<input>`) | Tailwind styling pulling semantic tokens |
| `Textarea` | (none — wraps native `<textarea>`) | Same |
| `Label` | `@radix-ui/react-label` | Accessible label association |
| `Card` | (none — `<div>` with semantic tokens) | Just styling |
| `Dialog` | `@radix-ui/react-dialog` | Modal, alert variant, drawer variant |
| `Spinner` | (none — pure CSS animation) | Reads `--duration-normal` token |
| `Toast` | `@radix-ui/react-toast` | Provider + queue via Zustand slice |

All primitives import semantic tokens from `@rhitta/design-tokens/tailwind` (as CSS variables) — never primitive tokens directly. Component code reads `bg-bg-surface`, not `bg-neutral-50`. Brand changes are one file in `@rhitta/design-tokens/src/semantic.ts`.

Phase 3+ expands the primitive surface (Dropdown, Popover, Tooltip, Tabs, etc.) as needed.

## Consequences
- **Brand and behavior are independently swappable.** Rebranding = swap design-tokens. Changing accessibility behavior = swap Radix.
- **Mobile parity is structural.** `@rhitta/design-system-mobile` provides the same primitive API surface (Button, Input, Dialog, etc.) using Ignite's themed factory + RN equivalents (per ADR-0008). Components on both platforms read semantic tokens through their respective consumption mechanism.
- **Cost: per-primitive Tailwind variant authoring.** Each primitive has a small variant table (`solid`/`outline`/`ghost` for Button, etc.). This is the price of unstyled-Radix-plus-Tailwind. Mitigation: `class-variance-authority` (or a similar lightweight variant helper) reduces boilerplate; ship it as a runtime dep of `design-system-web` if needed.
- **Cost: no out-of-the-box visual.** First-time Rhitta consumers see only structural primitives — no opinionated colors, no opinionated shadows. The tokens fill in the brand. Acceptable: that's what boilerplate-as-foundation looks like.
- **Radix accessibility track record applies for free.** Dialog focus traps, ARIA, keyboard navigation come from Radix.
- If we ever need a richer primitive (DataTable, Calendar) that Radix doesn't ship, we evaluate independently: pick a headless library, wrap it, expose it through `design-system-web`. Not in scope for v0.
