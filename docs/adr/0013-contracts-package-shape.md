# ADR 0013: `@rhitta/contracts` package shape

## Status
Accepted

## Context
`@rhitta/contracts` is the single source of truth for all cross-boundary data shapes in Rhitta (per ADR-0004). It is imported by the API, the web app, the mobile app, agent runs, and (eventually) third-party consumers. Its directory shape and export surface need to be *navigable* — by humans and especially by AI agents — without ambiguity.

Two distinct layout choices interact:

1. **Folder shape.** Flat `src/user.ts`, `src/order.ts` (per-resource) vs. nested `src/users/`, `src/billing/` (per-domain). Per-resource is fine at five entities, untenable at thirty. Per-domain mirrors `apps/api/src/modules/<feature>/` 1:1 (ADR-0003), letting an API module's `http/` layer import `@rhitta/contracts/<domain>` symmetrically with its own folder.

2. **Export surface.** A single root `.` export listing everything vs. per-subpath exports forcing consumers to name the domain (`import { UserSchema } from '@rhitta/contracts/users'`). Per-subpath gives smaller bundles, clearer dependency graphs, and — critical for Rhitta — denies agents the "import * and grep" cheat path.

A third decision orthogonal to the above: **how many shapes does an entity have?** Most TS codebases conflate "the user as it crosses the wire" with "the user in domain logic" with "the user in the database." Conflation breeds the worst silent bugs: a DB column rename leaks into an API response; a wire field is coerced into a domain invariant. Hexagonal architecture (ADR-0002) and the module DI pattern (ADR-0003) already imply three distinct shapes; this ADR makes that explicit.

## Decision

### Folder shape: per-domain, file-per-entity, barrel inside
```
packages/contracts/src/
├── users/
│   ├── user.ts          # UserSchema, CreateUserSchema, UpdateUserSchema
│   ├── session.ts       # SessionSchema, if owned by users
│   └── index.ts         # barrel re-export within the domain
├── billing/
│   ├── invoice.ts
│   ├── subscription.ts
│   └── index.ts
└── shared/
    ├── pagination.ts    # primitives consumed by 2+ domains
    ├── ids.ts           # branded ID schemas
    └── index.ts
```

Domain folders are plural lowercase (`users`, `invoices`). Entity files are singular kebab-case (`user.ts`, `payment-method.ts`). Schemas are `PascalCase + Schema` (`UserSchema`, `CreateUserSchema`). Inferred types share the name minus `Schema` (`export type User = z.infer<typeof UserSchema>`).

A schema goes in `shared/` **only if two or more domains consume it**. If only `users` uses `CursorSchema`, it stays in `users/`. Prevents the "shared/utils dumping ground" failure mode.

### Export surface: per-subpath, explicit enumeration, no `.` export
`package.json` `exports` enumerates each domain:
```json
{
  "exports": {
    "./users": "./dist/users/index.js",
    "./billing": "./dist/billing/index.js",
    "./shared": "./dist/shared/index.js"
  }
}
```
Adding a domain requires editing `exports` — visible in PR diffs. There is intentionally no root `.` export; `import * from '@rhitta/contracts'` fails.

### Three-shapes-per-entity boundary
Every entity exists in exactly three shapes, in three distinct locations:

| Shape | Lives in | Purpose | Mapped by |
|-------|----------|---------|-----------|
| **Domain class** | `apps/api/src/modules/<feature>/domain/<entity>.ts` | Behavior, invariants, value objects | constructor / factory |
| **Wire schema (`<Entity>Schema`)** | `@rhitta/contracts/<domain>/<entity>.ts` | HTTP request/response, form schemas, Pub/Sub events, agent payloads | the `http/` layer (`domain → wire`) |
| **Persistence row** | `apps/api/src/modules/<feature>/infra/postgres-<entity>-repository.ts` (internal) | DB column shape | the repository (`row ↔ domain`) |

The wire schema is *not* the persistence schema, and *not* the domain class. Three shapes, three mappers, three explicit boundaries. Components and use-cases never reach across them.

## Consequences
- **Navigation is mechanical.** "Where's the user schema?" → `packages/contracts/src/users/user.ts`. No grep required.
- **Tree-shaking is automatic.** Per-subpath exports give bundlers exact import sites.
- **Cross-stack types stay coherent.** A wire schema change propagates to every consumer via TypeScript.
- **Cost: three shapes per entity.** Each entity gets a domain class, a wire schema, a row mapper. The mappers are mechanical but real; this is the explicit price of hexagonal isolation.
- **Cost: explicit `exports` editing.** New domains require a `package.json` change. Intentional friction — it forces the choice "do we really need a new domain?" to be visible.
- **Future-proof for events / agent payloads.** Event schemas live in `events/` or alongside the owning domain, as appropriate. Same package, same shape constraints.
