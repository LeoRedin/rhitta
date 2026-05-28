import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId } from '@rhitta/contracts/notes'
import type { Note } from '../domain/note.js'

/**
 * Port for note persistence (per ADR-0002). Adapters live under `infra/`
 * — in-memory for tests/dev, Postgres for production (lands in Task 6).
 *
 * Per ADR-0002, ports live in the application layer because they are
 * defined by the needs of use-cases, not by infrastructure.
 */
export type ListNotesInput = {
  authorId: UserId
  cursor?: string | undefined
  limit: number
  includeDeleted: boolean
}

export type ListNotesResult = {
  items: Note[]
  nextCursor: string | null
}

export interface NoteRepository {
  save(note: Note): Promise<void>
  findById(id: NoteId): Promise<Note | null>
  list(input: ListNotesInput): Promise<ListNotesResult>
}
