/**
 * `GET /notes/:id` — fetch a note by id (author-only).
 *
 * Belt-and-braces per ADR-0017: the id path param is parsed with
 * `NoteIdSchema` (a branded UUID) on input and the response with
 * `NoteSchema` on output. Soft-deleted and missing notes both surface as
 * `NotFoundError` from the use-case — the deletion signal is
 * deliberately hidden from non-author callers.
 *
 * Encore static-analyzer note: see `create.ts` header — concrete
 * `NoteHttpResponse` interface required because Encore 1.57.5 can't
 * resolve `z.infer<typeof NoteSchema>`.
 */
import { NoteIdSchema, NoteSchema } from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { z } from 'zod'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import type { Assert, Equals } from '../../../lib/type-assert.js'
import type { GetNoteUseCase } from '../application/get-note.js'
import { notesModule } from '../module.js'
import type { NoteHttpResponse } from './create.js'
import { requestFromMeta } from './request-bridge.js'

export interface GetNoteHttpRequest {
  id: string
}

export type GetDeps = {
  authGate: AuthGate
  getNote: GetNoteUseCase
  request: Request
}

export async function getImpl(
  params: GetNoteHttpRequest,
  deps: GetDeps
): Promise<NoteHttpResponse> {
  try {
    const noteId = NoteIdSchema.parse(params.id)
    const user = await deps.authGate.getCurrentUser(deps.request)
    const note = await deps.getNote.execute({ id: noteId, requesterId: user.userId })
    return NoteSchema.parse(note.toDTO()) as NoteHttpResponse
  } catch (e) {
    throw mapError(e)
  }
}

export const get = api(
  { method: 'GET', path: '/notes/:id', expose: true },
  async ({ id }: GetNoteHttpRequest): Promise<NoteHttpResponse> => {
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

// -----------------------------------------------------------------------------
// Compile-time drift guards — see `lib/type-assert.ts` and ADR-0017 addendum.
// Request shape is `{ id: <NoteIdSchema input> }`; response uses the shared
// `NoteHttpResponse` from `create.ts`, whose drift guard lives there.
// -----------------------------------------------------------------------------

type _GetNoteHttpRequestMatches = Assert<
  Equals<GetNoteHttpRequest, { id: z.input<typeof NoteIdSchema> }>
>
