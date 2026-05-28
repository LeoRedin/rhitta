/**
 * `GET /notes/:id` — fetch a note by id (author-only).
 *
 * Belt-and-braces per ADR-0017: the id path param is parsed with
 * `NoteIdSchema` (a branded UUID) on input and the response with
 * `NoteSchema` on output. Soft-deleted and missing notes both surface as
 * `NotFoundError` from the use-case — the deletion signal is
 * deliberately hidden from non-author callers.
 */
import { type Note, NoteIdSchema, NoteSchema } from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import type { GetNoteUseCase } from '../application/get-note.js'
import { notesModule } from '../module.js'
import { requestFromMeta } from './request-bridge.js'

export type GetDeps = {
  authGate: AuthGate
  getNote: GetNoteUseCase
  request: Request
}

export async function getImpl(params: { id: string }, deps: GetDeps): Promise<Note> {
  try {
    const noteId = NoteIdSchema.parse(params.id)
    const user = await deps.authGate.getCurrentUser(deps.request)
    const note = await deps.getNote.execute({ id: noteId, requesterId: user.userId })
    return NoteSchema.parse(note.toDTO())
  } catch (e) {
    throw mapError(e)
  }
}

export const get = api(
  { method: 'GET', path: '/notes/:id', expose: true },
  async ({ id }: { id: string }): Promise<Note> => {
    return getImpl(
      { id },
      {
        authGate: authGate(),
        getNote: notesModule().useCases.getNote,
        request: requestFromMeta(currentRequest()),
      }
    )
  }
)
