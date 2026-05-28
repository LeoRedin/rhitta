import type { UserId } from '@rhitta/contracts/auth'
import type { CreateNote } from '@rhitta/contracts/notes'
import type { EventPublisher } from '../../../lib/pub-sub.js'
import { Note } from '../domain/note.js'
import type { NoteRepository } from './note-repository.js'

/**
 * Creates a new note owned by `authorId`. Emits a `note-created` event
 * after persistence so downstream subscribers (email digest, search
 * index, etc.) can fan out without coupling.
 */
export class CreateNoteUseCase {
  constructor(
    private readonly repo: NoteRepository,
    private readonly events: EventPublisher
  ) {}

  async execute(input: CreateNote & { authorId: UserId }): Promise<Note> {
    const note = Note.create({
      authorId: input.authorId,
      title: input.title,
      body: input.body,
    })
    await this.repo.save(note)
    await this.events.publish('note-created', {
      noteId: note.id,
      authorId: note.authorId,
      occurredAt: new Date(),
    })
    return note
  }
}
