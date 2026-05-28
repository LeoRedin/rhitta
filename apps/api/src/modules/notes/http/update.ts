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
 *
 * Encore static-analyzer note: see `create.ts` header — concrete
 * `*HttpRequest`/`*HttpResponse` interfaces required.
 */
import { NoteIdSchema, NoteSchema, UpdateNoteSchema } from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { z } from 'zod'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import type { Assert, Equals, Flatten } from '../../../lib/type-assert.js'
import type { UpdateNoteUseCase } from '../application/update-note.js'
import { notesModule } from '../module.js'
import type { NoteHttpResponse } from './create.js'
import { requestFromMeta } from './request-bridge.js'

export interface UpdateNoteHttpRequest {
  id: string
  title?: string
  body?: string
}

export type UpdateDeps = {
  authGate: AuthGate
  updateNote: UpdateNoteUseCase
  request: Request
}

export async function updateImpl(
  req: UpdateNoteHttpRequest,
  deps: UpdateDeps
): Promise<NoteHttpResponse> {
  try {
    const noteId = NoteIdSchema.parse(req.id)
    const input = UpdateNoteSchema.parse({ title: req.title, body: req.body })
    const user = await deps.authGate.getCurrentUser(deps.request)
    const note = await deps.updateNote.execute({
      ...input,
      id: noteId,
      requesterId: user.userId,
    })
    return NoteSchema.parse(note.toDTO()) as NoteHttpResponse
  } catch (e) {
    throw mapError(e)
  }
}

export const update = api(
  { method: 'PATCH', path: '/notes/:id', expose: true },
  async (req: UpdateNoteHttpRequest): Promise<NoteHttpResponse> => {
    return updateImpl(req, {
      authGate: authGate(),
      updateNote: notesModule().useCases.updateNote,
      request: requestFromMeta(currentRequest()),
    })
  }
)

// -----------------------------------------------------------------------------
// Compile-time drift guards — see `lib/type-assert.ts` and ADR-0017 addendum.
// Request envelope is the path param `id` plus the body shape from
// `UpdateNoteSchema`. Response uses the shared `NoteHttpResponse`.
// -----------------------------------------------------------------------------

type _UpdateNoteHttpRequestMatches = Assert<
  Equals<
    Flatten<UpdateNoteHttpRequest>,
    Flatten<{ id: z.input<typeof NoteIdSchema> } & z.input<typeof UpdateNoteSchema>>
  >
>
