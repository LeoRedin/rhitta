import { drizzle } from 'drizzle-orm/node-postgres'
import { SQLDatabase } from 'encore.dev/storage/sqldb'
import { Pool } from 'pg'

/**
 * The Encore-managed Postgres database for the `api` service (per ADR-0015
 * and ADR-0016). Encore provisions one DB per declaration; the binary is
 * passed `migrations.path` + `source: "drizzle"` so Encore drives Drizzle
 * Kit's migration runner during `encore run` / deploy.
 *
 * Migrations live centrally at `apps/api/drizzle/` (Task 16 decision —
 * Drizzle Kit's single-out-dir model doesn't accept per-module dirs).
 */
export const db = new SQLDatabase('rhitta', {
  migrations: {
    path: './drizzle',
    source: 'drizzle',
  },
})

/**
 * Drizzle ORM client wrapping the underlying Postgres pool.
 *
 * Encore's `SQLDatabase` exposes a `connectionString` getter (see
 * `node_modules/encore.dev/dist/storage/sqldb/database.d.ts`). We hand
 * that to `pg.Pool` and then to Drizzle so repositories can use the
 * type-safe query builder while Encore still owns provisioning,
 * migrations, and connection lifecycle.
 *
 * Per ADR-0005, Drizzle imports stay inside `infra/` files; this module
 * is the one exception (the seam itself).
 */
const pool = new Pool({ connectionString: db.connectionString })

export const orm = drizzle(pool)
export type Orm = typeof orm
