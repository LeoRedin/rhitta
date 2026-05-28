/**
 * Drizzle schema for the four Better Auth tables (per the Better Auth
 * Drizzle adapter contract — https://www.better-auth.com/docs/adapters/drizzle).
 *
 * Better Auth owns every row in these tables. Use-cases in this codebase
 * MUST NOT write to them directly; they go through Better Auth's API
 * (`auth.api.*`). The schema lives here only because the Drizzle adapter
 * needs a typed handle on the tables.
 *
 * Column names match Better Auth v1.6.11's defaults exactly — the
 * adapter maps its internal camelCase model names onto these snake_case
 * columns. If the columns drift from this layout, Better Auth fails at
 * the first query with an opaque "column not found" error.
 *
 * Migrations live centrally at `apps/api/drizzle/` (Task 16 decision).
 * The matching migration is `0001_auth_tables.sql`.
 */
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  // Used by the email/password provider to store the bcrypt hash.
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
