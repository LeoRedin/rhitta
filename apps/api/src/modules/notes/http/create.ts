/**
 * `POST /notes` — create a note for the authenticated user.
 *
 * Belt-and-braces validation per ADR-0017: the request payload is parsed
 * with `CreateNoteSchema` on the way in and the response with `NoteSchema`
 * on the way out, even though TypeScript already infers both. Validation
 * is the only thing standing between the wire and the domain — making it
 * runtime-enforced as well as compile-time-typed is the whole point.
 *
 * The Encore `api(...)` wrapper is intentionally thin: all real work
 * lives in {@link createImpl}, which takes its deps explicitly. The
 * integration test imports `createImpl` directly with hand-rolled
 * in-memory deps; production goes through `notesModule()` + `authGate()`.
 *
 * Auth note: this task ships with manual `authGate().getCurrentUser(...)`
 * inside the handler (see Task 7 plan, "Option B"). Encore's declarative
 * `auth: true` route gating would require a service-level `authHandler`
 * that we'd have to thread Better Auth into; deferred to a follow-up.
 *
 * Encore static-analyzer note: the `api(...)` signature uses concrete
 * `*HttpRequest`/`*HttpResponse` interfaces rather than the Zod-inferred
 * types from `@rhitta/contracts/notes`. Encore 1.57.5's static analyzer
 * can't resolve `z.infer<typeof Schema>` type aliases; concrete
 * interfaces are required for the generated client + manifest. The Zod
 * `.parse(...)` calls inside the handler still run, so ADR-0017's
 * belt-and-braces guarantee is unchanged. The interfaces are kept in
 * sync with the contract schemas by the runtime parse — any drift
 * surfaces as a test/runtime failure, not silent corruption.
 */
import { CreateNoteSchema, NoteSchema } from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { z } from 'zod'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import { sseEventBus } from '../../../lib/event-bus.js'
import type { Assert, Equals } from '../../../lib/type-assert.js'
import type { CreateNoteUseCase } from '../application/create-note.js'
import { notesModule } from '../module.js'
import { requestFromMeta } from './request-bridge.js'

/**
 * Wire-shape mirror of `CreateNoteSchema` from `@rhitta/contracts/notes`.
 * Concrete interface required by Encore's static analyzer (see file header).
 */
export interface CreateNoteHttpRequest {
  title: string
  body: string
}

/**
 * Wire-shape mirror of `NoteSchema` from `@rhitta/contracts/notes`. Branded
 * id types (`NoteId`, `UserId`) flatten to `string` at the wire boundary.
 */
export interface NoteHttpResponse {
  id: string
  authorId: string
  title: string
  body: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type CreateDeps = {
  authGate: AuthGate
  createNote: CreateNoteUseCase
  request: Request
}

export async function createImpl(
  req: CreateNoteHttpRequest,
  deps: CreateDeps
): Promise<NoteHttpResponse> {
  try {
    const input = CreateNoteSchema.parse(req)
    const user = await deps.authGate.getCurrentUser(deps.request)
    const note = await deps.createNote.execute({ ...input, authorId: user.userId })
    return NoteSchema.parse(note.toDTO()) as NoteHttpResponse
  } catch (e) {
    throw mapError(e)
  }
}

export const create = api(
  { method: 'POST', path: '/notes', expose: true },
  async (req: CreateNoteHttpRequest): Promise<NoteHttpResponse> => {
    const note = await createImpl(req, {
      authGate: authGate(),
      createNote: notesModule().useCases.createNote,
      request: requestFromMeta(currentRequest()),
    })

    // Broadcast to the in-process event bus so SSE subscribers (the
    // `/events/notes` stream) receive the event in realtime.
    sseEventBus.emit('note-created', {
      noteId: note.id,
      authorId: note.authorId,
      occurredAt: new Date(),
    })

    return note
  }
)

// -----------------------------------------------------------------------------
// Compile-time drift guards — see `lib/type-assert.ts` and ADR-0017 addendum.
// Branded id fields (`NoteId`, `UserId`) flatten to `string` on the wire, so
// we omit them from the comparison — they're verified by the runtime parse.
// -----------------------------------------------------------------------------

type _CreateNoteHttpRequestMatches = Assert<
  Equals<CreateNoteHttpRequest, z.input<typeof CreateNoteSchema>>
>

type _NoteHttpResponseMatches = Assert<
  Equals<
    Omit<NoteHttpResponse, 'id' | 'authorId'>,
    Omit<z.infer<typeof NoteSchema>, 'id' | 'authorId'>
  >
>
