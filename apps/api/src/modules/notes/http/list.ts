/**
 * `GET /notes` — list the authenticated user's notes (cursor-paginated).
 *
 * Belt-and-braces per ADR-0017: the query is parsed with
 * `ListNotesQuerySchema` on input (which fills defaults for `limit` and
 * `includeDeleted`) and the response with `ListNotesResponseSchema` on
 * output. The response schema lives here, not in `@rhitta/contracts`,
 * because it's an HTTP-layer projection of `ListNotesResult` from the
 * application layer.
 */
import { type ListNotesQuery, ListNotesQuerySchema, NoteSchema } from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import { z } from 'zod'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import type { ListNotesUseCase } from '../application/list-notes.js'
import { notesModule } from '../module.js'
import { requestFromMeta } from './request-bridge.js'

export const ListNotesResponseSchema = z.object({
  items: z.array(NoteSchema),
  nextCursor: z.string().nullable(),
})
export type ListNotesResponse = z.infer<typeof ListNotesResponseSchema>

export type ListDeps = {
  authGate: AuthGate
  listNotes: ListNotesUseCase
  request: Request
}

export async function listImpl(
  req: Partial<ListNotesQuery>,
  deps: ListDeps
): Promise<ListNotesResponse> {
  try {
    const input = ListNotesQuerySchema.parse(req)
    const user = await deps.authGate.getCurrentUser(deps.request)
    const result = await deps.listNotes.execute({ ...input, requesterId: user.userId })
    return ListNotesResponseSchema.parse({
      items: result.items.map((n) => n.toDTO()),
      nextCursor: result.nextCursor,
    })
  } catch (e) {
    throw mapError(e)
  }
}

export const list = api(
  { method: 'GET', path: '/notes', expose: true },
  async (req: Partial<ListNotesQuery>): Promise<ListNotesResponse> => {
    return listImpl(req, {
      authGate: authGate(),
      listNotes: notesModule().useCases.listNotes,
      request: requestFromMeta(currentRequest()),
    })
  }
)
