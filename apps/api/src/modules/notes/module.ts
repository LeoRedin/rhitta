/**
 * Notes module composition root (per ADR-0003).
 *
 * Builds the module's use-case graph from explicit deps. The HTTP layer
 * (Task 7) imports the {@link notesModule} singleton accessor; tests
 * construct modules directly with in-memory adapters via
 * {@link registerNotesModule}.
 *
 * The `repository` dep is optional: production wiring defaults to the
 * Postgres adapter (Task 6); unit tests pass an in-memory adapter.
 */

import { orm } from '../../lib/db.js'
import type { EventPublisher } from '../../lib/pub-sub.js'
import { EncoreEventPublisher } from '../../lib/pub-sub.js'
import { CreateNoteUseCase } from './application/create-note.js'
import { DeleteNoteUseCase } from './application/delete-note.js'
import { GetNoteUseCase } from './application/get-note.js'
import { ListNotesUseCase } from './application/list-notes.js'
import type { NoteRepository } from './application/note-repository.js'
import { UpdateNoteUseCase } from './application/update-note.js'
import { PostgresNoteRepository } from './infra/postgres-note-repository.js'

export type NotesDeps = {
  eventPublisher: EventPublisher
  /** Optional repository override. Defaults to {@link PostgresNoteRepository}. */
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
  const repository = deps.repository ?? new PostgresNoteRepository(orm)
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

/**
 * Lazily-initialised production singleton. Wired the first time an HTTP
 * handler invokes it, with the real `EncoreEventPublisher` + the
 * Postgres-backed repository.
 *
 * Tests must NOT import this directly — they call {@link registerNotesModule}
 * with in-memory deps, or use {@link __setNotesModuleForTesting} when
 * integration-testing an HTTP handler that reaches for the singleton via
 * `notesModule()`.
 */
let _instance: NotesModule | null = null

export function notesModule(): NotesModule {
  if (_instance === null) {
    _instance = registerNotesModule({
      eventPublisher: new EncoreEventPublisher(),
    })
  }
  return _instance
}

export function __setNotesModuleForTesting(module: NotesModule | null): void {
  _instance = module
}
