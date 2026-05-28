import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId, UpdateNote } from '@rhitta/contracts/notes'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../lib/errors.js'
import type { Note } from '../domain/note.js'
import type { NoteRepository } from './note-repository.js'

/**
 * Updates a note's title/body in place. Enforces ownership and refuses
 * to mutate a soft-deleted note (which would otherwise resurrect stale
 * content). The `ConflictError` here is distinct from the `NotFoundError`
 * thrown by `get-note` for deleted notes — `update` deliberately surfaces
 * the conflict because the caller had a recent enough handle to attempt
 * a write.
 */
export class UpdateNoteUseCase {
  constructor(private readonly repo: NoteRepository) {}

  async execute(input: UpdateNote & { id: NoteId; requesterId: UserId }): Promise<Note> {
    const note = await this.repo.findById(input.id)
    if (note === null) {
      throw new NotFoundError('Note', input.id)
    }
    if (note.isDeleted) {
      throw new ConflictError('Cannot update a deleted note')
    }
    if (note.authorId !== input.requesterId) {
      throw new ForbiddenError("Cannot update another user's note")
    }
    note.update({ title: input.title, body: input.body })
    await this.repo.save(note)
    return note
  }
}
