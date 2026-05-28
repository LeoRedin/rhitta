/**
 * Notes module composition root (per ADR-0003).
 *
 * Builds the module's use-case graph from explicit deps. The HTTP layer
 * (Task 7) will import this to mount endpoints; tests construct it
 * directly with in-memory adapters.
 *
 * The `repository` dep is optional: if omitted we fall back to the
 * in-memory adapter. Production wiring (Task 10) injects the Postgres
 * adapter (Task 6) here.
 */
import type { EventPublisher } from '../../lib/pub-sub.js'
import { CreateNoteUseCase } from './application/create-note.js'
import { DeleteNoteUseCase } from './application/delete-note.js'
import { GetNoteUseCase } from './application/get-note.js'
import { ListNotesUseCase } from './application/list-notes.js'
import type { NoteRepository } from './application/note-repository.js'
import { UpdateNoteUseCase } from './application/update-note.js'
import { InMemoryNoteRepository } from './infra/in-memory-note-repository.js'

export type NotesDeps = {
  eventPublisher: EventPublisher
  /** Optional repository override. Defaults to {@link InMemoryNoteRepository}. */
  repository?: NoteRepository
}

export type NotesModule = {
  repository: NoteRepository
  useCases: {
    createNote: CreateNoteUseCase
    getNote: GetNoteUseCase
    listNotes: ListNotesUseCase
    updateNote: UpdateNoteUseCase
    deleteNote: DeleteNoteUseCase
  }
}

export function registerNotesModule(deps: NotesDeps): NotesModule {
  const repository = deps.repository ?? new InMemoryNoteRepository()
  return {
    repository,
    useCases: {
      createNote: new CreateNoteUseCase(repository, deps.eventPublisher),
      getNote: new GetNoteUseCase(repository),
      listNotes: new ListNotesUseCase(repository),
      updateNote: new UpdateNoteUseCase(repository),
      deleteNote: new DeleteNoteUseCase(repository),
    },
  }
}
