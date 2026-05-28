/**
 * `GET /notes` — list the authenticated user's notes (cursor-paginated).
 *
 * Belt-and-braces per ADR-0017: the query is parsed with
 * `ListNotesQuerySchema` on input (which fills defaults for `limit` and
 * `includeDeleted`) and the response with `ListNotesResponseSchema` on
 * output. The response schema lives here, not in `@rhitta/contracts`,
 * because it's an HTTP-layer projection of `ListNotesResult` from the
 * application layer.
 *
 * Encore static-analyzer note: see `create.ts` header — concrete
 * `*HttpRequest`/`*HttpResponse` interfaces required.
 */
import { ListNotesQuerySchema, NoteSchema } from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import { z } from 'zod'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import type { Assert, Equals } from '../../../lib/type-assert.js'
import type { ListNotesUseCase } from '../application/list-notes.js'
import { notesModule } from '../module.js'
import type { NoteHttpResponse } from './create.js'
import { requestFromMeta } from './request-bridge.js'

export const ListNotesResponseSchema = z.object({
  items: z.array(NoteSchema),
  nextCursor: z.string().nullable(),
})

/** Optional query params — Encore parses these from the URL. */
export interface ListNotesHttpRequest {
  cursor?: string
  limit?: number
  includeDeleted?: boolean
}

export interface ListNotesHttpResponse {
  items: NoteHttpResponse[]
  nextCursor: string | null
}

export type ListDeps = {
  authGate: AuthGate
  listNotes: ListNotesUseCase
  request: Request
}

export async function listImpl(
  req: ListNotesHttpRequest,
  deps: ListDeps
): Promise<ListNotesHttpResponse> {
  try {
    const input = ListNotesQuerySchema.parse(req)
    const user = await deps.authGate.getCurrentUser(deps.request)
    const result = await deps.listNotes.execute({ ...input, requesterId: user.userId })
    return ListNotesResponseSchema.parse({
      items: result.items.map((n) => n.toDTO()),
      nextCursor: result.nextCursor,
    }) as ListNotesHttpResponse
  } catch (e) {
    throw mapError(e)
  }
}

export const list = api(
  { method: 'GET', path: '/notes', expose: true },
  async (req: ListNotesHttpRequest): Promise<ListNotesHttpResponse> => {
    return listImpl(req, {
      authGate: authGate(),
      listNotes: notesModule().useCases.listNotes,
      request: requestFromMeta(currentRequest()),
    })
  }
)

// -----------------------------------------------------------------------------
// Compile-time drift guards — see `lib/type-assert.ts` and ADR-0017 addendum.
// `z.input<>` (not `z.infer<>`) is correct for the request because
// `ListNotesQuerySchema` supplies defaults — the wire shape has the optional
// inputs, not the post-default outputs.
// -----------------------------------------------------------------------------

type _ListNotesHttpRequestMatches = Assert<
  Equals<ListNotesHttpRequest, z.input<typeof ListNotesQuerySchema>>
>

type _ListNotesHttpResponseMatches = Assert<
  Equals<
    Omit<ListNotesHttpResponse, 'items'>,
    Omit<z.infer<typeof ListNotesResponseSchema>, 'items'>
  >
>
