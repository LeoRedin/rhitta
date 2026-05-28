# ADR 0017: Belt-and-braces validation in HTTP handlers

## Status
Accepted

## Context
ADR-0004 mandates Zod as the sole validator across Rhitta, with all schemas in `@rhitta/contracts`. ADR-0009 picks Encore.ts as the API framework. These two decisions interact at the HTTP boundary in an interesting way.

Encore.ts performs **structural validation** at the wire level by reading the TypeScript types of an endpoint's request and response. If you declare an endpoint with `async (req: CreateNoteRequest): Promise<NoteResponse>`, Encore generates a runtime schema from those types and rejects malformed requests with 400 before your handler ever runs. This is good — it gives free wire-level validation.

But Encore's TS-derived validation cannot enforce **business rules** that live in Zod refinements: `z.string().email()`, `z.string().regex(/.../)`, `z.string().refine(s => s.length <= 280)`, `z.date().min(new Date())`. These are exactly the rules that bugs hide behind, and they're already authored in `@rhitta/contracts`.

Two clean shapes:

1. **Encore native only.** Endpoint signature is `async (req: CreateNoteRequest)`. Encore validates wire shape. Business rules… enforced somewhere else? Maybe at the domain layer (use-case checks invariants). Risk: business rules become use-case-side, scattered, easy to skip.
2. **Encore `api.raw` + manual Zod parse only.** Bypass Encore's native validation entirely; parse the raw body with Zod. Loses Encore's type inference for the wire format, generated client SDKs, OpenAPI export — Encore's flagship features.

Neither is clean.

## Decision
Adopt the **belt-and-braces** pattern. Every HTTP handler:

1. Declares Encore endpoint signature with TS types derived from the Zod schema via `z.infer<typeof Schema>`. Encore validates the wire shape and generates client SDKs from these types.
2. Inside the handler, **explicitly calls `Schema.parse(req)`** on the input before doing anything else. This applies Zod's business rules (refinements, transforms, branded ID validation) at runtime.
3. Same for outbound: `return ResponseSchema.parse(domainObject.toDTO())` to guarantee the response shape obeys the contract.

```typescript
// apps/api/src/modules/notes/http/create.ts
import { api } from 'encore.dev/api'
import {
  CreateNoteSchema,
  NoteSchema,
  type CreateNote,
  type Note,
} from '@rhitta/contracts/notes'
import { mapError } from '~/lib/error-mapper'

type Req = CreateNote
type Res = Note

export const create = api(
  { method: 'POST', path: '/notes', expose: true, auth: true },
  async (req: Req): Promise<Res> => {
    const input = CreateNoteSchema.parse(req)
    try {
      const note = await useCases.createNote.execute(input)
      return NoteSchema.parse(note.toDTO())
    } catch (e) {
      throw mapError(e)
    }
  },
)
```

## Consequences
- **Encore's native features intact.** Generated client SDKs, OpenAPI, request tracing, structural validation — all work as documented.
- **Zod runtime validation enforced.** Business rules in `@rhitta/contracts` actually run on every request. ADR-0004's promise holds.
- **Single source of truth.** Schemas live in one place; types flow via `z.infer`. Drift impossible.
- **Cost: one parse call per request.** Microseconds. Negligible at every realistic QPS.
- **Cost: visible boilerplate.** Each handler has a `.parse(req)` and `.parse(outboundDTO)`. Repetitive but uniform — easy to grep, easy to generate, easy for agents to follow without ambiguity.
- **Outbound parse is non-optional.** A use-case bug that returns extra fields or wrong types is caught at the boundary, not by the consumer. The boundary is the contract; enforce both directions.
- **Codegen opportunity** (Phase 3 generator): `gen:resource` produces handler scaffolds with both parses already wired. Removes the boilerplate cost without removing the discipline.

## Addendum (Phase 2a, Task 28) — concrete HTTP interfaces + compile-time drift guards

The decision above assumed `async (req: z.infer<typeof CreateNoteSchema>)` works as the endpoint signature. In practice, Encore.ts 1.57.5's static analyzer **cannot resolve `z.infer<typeof Schema>` type aliases** when generating the runtime schema for an endpoint — the analyzer reads TS source structurally and gives up on Zod-derived types. Endpoints declared that way are silently dropped from the generated client and OpenAPI surface.

Workaround until the Phase 3 generator lands:

1. Each HTTP handler declares **concrete `*HttpRequest` and `*HttpResponse` interfaces** that mirror the Zod schema's wire shape (branded id types flatten to `string` at the boundary, per ADR-0013's "branded inside, bare on the wire" contract).
2. The Encore `api(...)` signature uses those concrete interfaces. Encore is happy.
3. The handler body still does `Schema.parse(req)` and `ResponseSchema.parse(domainObject.toDTO())` — belt-and-braces unchanged.
4. **Compile-time drift guards** live next to the interface declarations. Each file ends with one or two `Assert<Equals<...>>` type aliases that compare the HTTP interface to `z.input<typeof Schema>` (request) or `z.infer<typeof Schema>` (response, with branded fields omitted). When a schema changes and the interface doesn't, `pnpm typecheck` fails before any test runs. The helper lives at `apps/api/src/lib/type-assert.ts`.

Drift surface is now zero:
- **Compile time:** `Assert<Equals<...>>` catches structural differences at `pnpm typecheck`.
- **Runtime:** `Schema.parse(req)` catches anything that slipped through (e.g. refinements that don't show up at the type level).

Phase 3's `gen:resource` generator will emit these interfaces directly from the Zod schemas, deleting both the duplication and the assertion stanzas in one pass.
