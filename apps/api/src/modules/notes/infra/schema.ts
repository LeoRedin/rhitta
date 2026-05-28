import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Drizzle schema for the `notes` table (per ADR-0013 — shape #3 of three:
 * domain class, wire DTO, persistence row). This file is the only
 * representation of the table's column layout; drizzle-kit generates the
 * forward-only migration from it.
 *
 * `authorId` references `user.id` from the Better Auth `user` table (see
 * `modules/auth/schema.ts`, Task 4). A FK constraint is **intentionally
 * omitted for v0**: Drizzle FK declarations across modules entangle the
 * schemas and complicate the per-module ownership story. We'll add the
 * constraint later (likely in a follow-up migration) once cross-module
 * relationships need enforcing at the DB layer.
 */
export const notes = pgTable('notes', {
  id: text('id').primaryKey(),
  authorId: text('author_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export type NoteRow = typeof notes.$inferSelect
export type NewNoteRow = typeof notes.$inferInsert
