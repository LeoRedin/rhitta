import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId } from '@rhitta/contracts/notes'
import { ForbiddenError, NotFoundError } from '../../../lib/errors.js'
import type { NoteRepository } from './note-repository.js'

/**
 * Soft-deletes a note: flips `deletedAt` and persists. Returns void —
 * the caller already knows the id. Soft-deleted or missing notes are
 * indistinguishable to the caller (both surface `NotFoundError`) to
 * avoid leaking the deletion signal.
 */
export class DeleteNoteUseCase {
  constructor(private readonly repo: NoteRepository) {}

  async execute(input: { id: NoteId; requesterId: UserId }): Promise<void> {
    const note = await this.repo.findById(input.id)
    if (note === null || note.isDeleted) {
      throw new NotFoundError('Note', input.id)
    }
    if (note.authorId !== input.requesterId) {
      throw new ForbiddenError("Cannot delete another user's note")
    }
    note.softDelete()
    await this.repo.save(note)
  }
}
