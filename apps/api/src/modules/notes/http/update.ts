/**
 * `PATCH /notes/:id` — partial-update a note's title/body.
 *
 * Belt-and-braces per ADR-0017: the path param is parsed with
 * `NoteIdSchema`, the rest of the payload with `UpdateNoteSchema`, and
 * the response with `NoteSchema`. The id is split off from the body
 * before parsing because Encore merges path params and body into one
 * argument object, but the contract schemas keep them separate.
 *
 * The use-case surfaces a `ConflictError` if the note is soft-deleted
 * (distinct from the `NotFoundError` `GetNoteUseCase` uses) — the
 * caller had a recent handle to it, so we don't pretend it's missing.
 */
import {
  type Note,
  NoteIdSchema,
  NoteSchema,
  type UpdateNote,
  UpdateNoteSchema,
} from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import type { UpdateNoteUseCase } from '../application/update-note.js'
import { notesModule } from '../module.js'
import { requestFromMeta } from './request-bridge.js'

export type UpdateDeps = {
  authGate: AuthGate
  updateNote: UpdateNoteUseCase
  request: Request
}

export async function updateImpl(
  req: UpdateNote & { id: string },
  deps: UpdateDeps
): Promise<Note> {
  try {
    const noteId = NoteIdSchema.parse(req.id)
    const input = UpdateNoteSchema.parse({ title: req.title, body: req.body })
    const user = await deps.authGate.getCurrentUser(deps.request)
    const note = await deps.updateNote.execute({
      ...input,
      id: noteId,
      requesterId: user.userId,
    })
    return NoteSchema.parse(note.toDTO())
  } catch (e) {
    throw mapError(e)
  }
}

export const update = api(
  { method: 'PATCH', path: '/notes/:id', expose: true },
  async (req: UpdateNote & { id: string }): Promise<Note> => {
    return updateImpl(req, {
      authGate: authGate(),
      updateNote: notesModule().useCases.updateNote,
      request: requestFromMeta(currentRequest()),
    })
  }
)
