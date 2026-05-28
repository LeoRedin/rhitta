import type { NoteId } from '@rhitta/contracts/notes'
import type {
  ListNotesInput,
  ListNotesResult,
  NoteRepository,
} from '../application/note-repository.js'
import type { Note } from '../domain/note.js'

/**
 * In-memory `NoteRepository` for unit tests and local dev. Stores entities
 * by id and implements opaque cursor pagination by treating the cursor as
 * the id of the last item returned on the previous page.
 *
 * Not safe for concurrent use across processes — that's what the Postgres
 * adapter (Task 6) is for.
 */
export class InMemoryNoteRepository implements NoteRepository {
  private readonly notes = new Map<NoteId, Note>()

  async save(note: Note): Promise<void> {
    this.notes.set(note.id, note)
  }

  async findById(id: NoteId): Promise<Note | null> {
    return this.notes.get(id) ?? null
  }

  async list(input: ListNotesInput): Promise<ListNotesResult> {
    const filtered = Array.from(this.notes.values())
      .filter((n) => n.authorId === input.authorId)
      .filter((n) => input.includeDeleted || !n.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const startIdx = input.cursor ? filtered.findIndex((n) => n.id === input.cursor) + 1 : 0
    const page = filtered.slice(startIdx, startIdx + input.limit)
    const nextCursor =
      startIdx + input.limit < filtered.length && page.length > 0
        ? (page[page.length - 1] as Note).id
        : null
    return { items: page, nextCursor }
  }

  /** Test helper — not part of the `NoteRepository` port. */
  clear(): void {
    this.notes.clear()
  }
}
