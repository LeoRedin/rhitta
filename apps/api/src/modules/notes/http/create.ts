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
 */
import { type CreateNote, CreateNoteSchema, type Note, NoteSchema } from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import type { CreateNoteUseCase } from '../application/create-note.js'
import { notesModule } from '../module.js'
import { requestFromMeta } from './request-bridge.js'

export type CreateDeps = {
  authGate: AuthGate
  createNote: CreateNoteUseCase
  request: Request
}

export async function createImpl(req: CreateNote, deps: CreateDeps): Promise<Note> {
  try {
    const input = CreateNoteSchema.parse(req)
    const user = await deps.authGate.getCurrentUser(deps.request)
    const note = await deps.createNote.execute({ ...input, authorId: user.userId })
    return NoteSchema.parse(note.toDTO())
  } catch (e) {
    throw mapError(e)
  }
}

export const create = api(
  { method: 'POST', path: '/notes', expose: true },
  async (req: CreateNote): Promise<Note> => {
    return createImpl(req, {
      authGate: authGate(),
      createNote: notesModule().useCases.createNote,
      request: requestFromMeta(currentRequest()),
    })
  }
)
