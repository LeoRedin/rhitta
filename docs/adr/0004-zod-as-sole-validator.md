# ADR 0004: Zod as the sole validator

## Status
Accepted

## Context
Validation libraries proliferate in JS/TS land: AJV, class-validator, Joi, Yup, Valibot, native framework schemas (Fastify, Encore), hand-rolled `typeof` chains. Each comes with its own DSL, error shape, and inference story.

Mixing validators inside one codebase is the worst outcome: contracts become locally true, globally inconsistent. Agents that look for "how do we validate here" will copy whichever validator is closest, compounding the mess.

## Decision
**Zod is the only validator** allowed in Rhitta. All shared schemas live in `@rhitta/contracts` and are imported by API, web, and mobile. Inferred types via `z.infer<typeof Schema>` are the canonical types — no parallel hand-typed interfaces.

No AJV, no class-validator, no Joi, no Yup, no Valibot, no native framework schemas. Hand-rolled validation at boundaries is banned.

## Consequences
- One schema definition flows from API request validation → DB persistence shape → web/mobile form schemas. Drift becomes impossible by construction.
- Error shapes are consistent across the stack — the central error handler maps `ZodError` once.
- Cost: Zod's runtime overhead is non-trivial at very high QPS. If we ever hit that ceiling, we revisit (e.g., Valibot, ArkType). Not a v0 concern.
- Agents have exactly one validator to reach for. The decision is preempted.
