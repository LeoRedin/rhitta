/**
 * `DELETE /notes/:id` — soft-delete a note (author-only).
 *
 * Belt-and-braces per ADR-0017: id parsed with `NoteIdSchema` on input;
 * response is `void`, so there's nothing to parse on the way out — the
 * `mapError` boundary still applies to whatever the use-case throws.
 *
 * The exported symbol is `deleteNote` (not `delete`) because `delete` is
 * a JavaScript reserved word. Encore picks up the binding name, not the
 * `path`, when discovering endpoints — so the route is still `DELETE
 * /notes/:id` and that's what clients see.
 */
import { NoteIdSchema } from '@rhitta/contracts/notes'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import type { DeleteNoteUseCase } from '../application/delete-note.js'
import { notesModule } from '../module.js'
import { requestFromMeta } from './request-bridge.js'

export type DeleteDeps = {
  authGate: AuthGate
  deleteNote: DeleteNoteUseCase
  request: Request
}

export async function deleteImpl(params: { id: string }, deps: DeleteDeps): Promise<void> {
  try {
    const noteId = NoteIdSchema.parse(params.id)
    const user = await deps.authGate.getCurrentUser(deps.request)
    await deps.deleteNote.execute({ id: noteId, requesterId: user.userId })
  } catch (e) {
    throw mapError(e)
  }
}

export const deleteNote = api(
  { method: 'DELETE', path: '/notes/:id', expose: true },
  async ({ id }: { id: string }): Promise<void> => {
    return deleteImpl(
      { id },
      {
        authGate: authGate(),
        deleteNote: notesModule().useCases.deleteNote,
        request: requestFromMeta(currentRequest()),
      }
    )
  }
)
