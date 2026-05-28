import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId } from '@rhitta/contracts/notes'
import { ForbiddenError, NotFoundError } from '../../../lib/errors.js'
import type { Note } from '../domain/note.js'
import type { NoteRepository } from './note-repository.js'

/**
 * Fetches a note by id, enforcing ownership. Soft-deleted notes are
 * indistinguishable from missing ones from the caller's perspective —
 * we surface `NotFoundError` either way to avoid leaking the deletion
 * signal.
 */
export class GetNoteUseCase {
  constructor(private readonly repo: NoteRepository) {}

  async execute(input: { id: NoteId; requesterId: UserId }): Promise<Note> {
    const note = await this.repo.findById(input.id)
    if (note === null || note.isDeleted) {
      throw new NotFoundError('Note', input.id)
    }
    if (note.authorId !== input.requesterId) {
      throw new ForbiddenError("Cannot access another user's note")
    }
    return note
  }
}
