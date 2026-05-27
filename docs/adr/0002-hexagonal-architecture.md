# ADR 0002: Hexagonal architecture (ports and adapters)

## Status
Accepted

## Context
Production apps inevitably integrate auth, payments, email, storage, analytics, AI providers, and notifications. The naive shape — SDK calls inside route handlers — couples business logic to vendors, makes testing hostile, and makes vendor swaps require app-wide rewrites.

In an AI-assisted codebase, the failure mode is sharper: agents will reach for whichever SDK is "closest" and bypass abstraction layers if those layers aren't both obvious and enforced.

## Decision
Adopt **hexagonal architecture (ports and adapters)** throughout Rhitta:
- The application core depends on **typed interfaces (ports)** for every external concern.
- Concrete **adapters** implement those ports for specific providers and live exclusively in `infra/`.
- Route handlers, use-cases, and domain code receive ports via dependency injection. They never import vendor SDKs directly.
- The structure validator and Biome rules ban SDK imports outside `infra/`.

Default adapters ship with v0. Swapping providers means writing a new adapter, never restructuring the app.

## Consequences
- Vendor swaps are localized — confidence to migrate to a new payments or auth provider stays high.
- Testing is straightforward: pass an in-memory adapter to use-cases.
- Cost: a small upfront tax (port + default adapter + DI wiring) for every external integration. Worth it.
- Agents that try to `import { Stripe } from 'stripe'` in a handler will be caught by lint or the structure validator. This is the point.
