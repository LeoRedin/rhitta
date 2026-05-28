import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId } from '@rhitta/contracts/notes'
import { and, desc, eq, isNull, lt, or } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type {
  ListNotesInput,
  ListNotesResult,
  NoteRepository,
} from '../application/note-repository.js'
import { Note } from '../domain/note.js'
import { type NoteRow, notes } from './schema.js'

/**
 * Postgres-backed `NoteRepository` (per ADR-0002, ADR-0005, ADR-0016).
 *
 * The Drizzle ORM client is injected via constructor rather than imported
 * from `lib/db.ts`. This keeps the adapter pure (no module-load side
 * effects) and lets integration tests point it at an ephemeral container
 * without dragging in Encore's `SQLDatabase`. Production wiring
 * (`composeRoot`, Task 10) constructs it with the singleton orm from
 * `lib/db.ts`.
 */
export class PostgresNoteRepository implements NoteRepository {
  constructor(private readonly orm: NodePgDatabase) {}

  async save(note: Note): Promise<void> {
    const dto = note.toDTO()
    await this.orm
      .insert(notes)
      .values({
        id: dto.id,
        authorId: dto.authorId,
        title: dto.title,
        body: dto.body,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
      })
      .onConflictDoUpdate({
        target: notes.id,
        set: {
          title: dto.title,
          body: dto.body,
          updatedAt: dto.updatedAt,
          deletedAt: dto.deletedAt,
        },
      })
  }

  async findById(id: NoteId): Promise<Note | null> {
    const rows = await this.orm.select().from(notes).where(eq(notes.id, id)).limit(1)
    const row = rows[0]
    if (!row) return null
    return Note.fromPersistence(this.rowToDto(row))
  }

  async list(input: ListNotesInput): Promise<ListNotesResult> {
    // Opaque cursor pagination over a stable sort key.
    //
    // We order by (createdAt DESC, id DESC) — `id` is a tiebreaker so the
    // order is total even when two notes share a timestamp. The cursor is
    // the id of the last row returned on the previous page; we look it up
    // to recover its createdAt for the (a, b) lexicographic comparison.
    let cursorRow: NoteRow | undefined
    if (input.cursor) {
      const result = await this.orm.select().from(notes).where(eq(notes.id, input.cursor)).limit(1)
      cursorRow = result[0]
    }

    const conditions = [eq(notes.authorId, input.authorId as string)]
    if (!input.includeDeleted) {
      conditions.push(isNull(notes.deletedAt))
    }
    if (cursorRow) {
      // Items "after" the cursor in (createdAt DESC, id DESC) ordering:
      //   createdAt < cursor.createdAt
      //   OR (createdAt == cursor.createdAt AND id < cursor.id)
      const after = or(
        lt(notes.createdAt, cursorRow.createdAt),
        and(eq(notes.createdAt, cursorRow.createdAt), lt(notes.id, cursorRow.id))
      )
      // biome-ignore lint/style/noNonNullAssertion: `or` returns SQL when given >=1 args
      conditions.push(after!)
    }

    const rows = await this.orm
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.createdAt), desc(notes.id))
      .limit(input.limit + 1)

    const hasMore = rows.length > input.limit
    const pageRows = hasMore ? rows.slice(0, input.limit) : rows
    const items = pageRows.map((row) => Note.fromPersistence(this.rowToDto(row)))
    const nextCursor = hasMore && pageRows.length > 0 ? (pageRows.at(-1) as NoteRow).id : null

    return { items, nextCursor }
  }

  private rowToDto(row: NoteRow) {
    return {
      id: row.id as NoteId,
      authorId: row.authorId as UserId,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    }
  }
}
