# ADR 0016: Drizzle ORM as the canonical repository tool

## Status
Accepted

## Context
ADR-0005 mandates that all database access funnel through repository files in `infra/postgres-*-repository.ts`. The repositories still need to *talk* to Postgres somehow. Candidates:

- **Hand-rolled `pg` / `postgres.js`.** Maximum control, zero magic, but every repository re-implements parameterized queries, mapping, and transaction handling. Inviting bugs.
- **Prisma.** Most popular; code-gen-based; heavy runtime; opaque migration history; the generated client encourages reach-into-everywhere usage that ADR-0005 already bans.
- **TypeORM.** Decorator-heavy, legacy patterns, weak inference.
- **Kysely.** Pure type-safe query builder; no ORM. Excellent inference but no schema definition layer; pairs naturally with a separate migration tool.
- **Drizzle.** Lightweight ORM with TypeScript-defined schema, SQL-first migration files (versioned, reviewable), strong query inference, no code-gen step, small runtime. Active development as of 2026.

The criteria: type-safety from schema all the way through repository methods, migrations that read as plain SQL (so review and rollback are obvious), and zero magic outside the seam ADR-0005 already enforces.

## Decision
Adopt **Drizzle ORM + Drizzle Kit** as the canonical repository tool inside `apps/api`. Schema is declared in TypeScript under each module's `infra/schema.ts` and imported by the repository file. Drizzle Kit generates and applies SQL migrations.

Migrations live at `apps/api/src/modules/<feature>/infra/migrations/`. They are forward-only, hand-reviewed SQL files. The app applies pending migrations at startup in dev; production applies them via a CI step before the new image takes traffic.

Repositories use Drizzle's query builder internally but expose **domain-shaped methods** — `findById(id: NoteId): Promise<Note | null>`, `save(note: Note): Promise<void>`. Use-cases never see Drizzle types; the schema-to-domain mapping happens inside the repository (per ADR-0013 "three shapes per entity"). Drizzle types stay inside `infra/`.

## Consequences
- Schema, migrations, and queries share one toolchain — no impedance mismatch between schema definition (e.g., Prisma's `.prisma` DSL) and query interface (e.g., generated client).
- SQL migrations are plain `.sql` files. Reviewable on GitHub. Rollback strategy is "write a new forward-only migration that reverses." Standard discipline.
- Lightweight runtime — no code-gen, no extra build step.
- Strong inference: a misspelled column in a `select` is a TypeScript error.
- Drizzle imports live exclusively in `infra/` files (per ADR-0005 enforcement via Biome `noRestrictedImports` once Phase 2 lands and ADR-0011 implementation completes).
- Cost: Drizzle is younger than Prisma; smaller ecosystem of plugins. Acceptable trade-off — Drizzle's surface is small enough that "plugins" matter less.
- If Drizzle becomes unmaintained, the migration to Kysely or hand-rolled is mechanical: repositories already expose domain-shaped methods, so swapping the internal query layer is local.
