import type { UserId } from '@rhitta/contracts/auth'
import type { ListNotesQuery } from '@rhitta/contracts/notes'
import type { ListNotesResult, NoteRepository } from './note-repository.js'

/**
 * Lists notes owned by `requesterId`, with cursor pagination and an opt-in
 * `includeDeleted` flag (used by debugging or admin views). Ordering and
 * pagination semantics are encapsulated by the repository implementation.
 */
export class ListNotesUseCase {
  constructor(private readonly repo: NoteRepository) {}

  async execute(input: ListNotesQuery & { requesterId: UserId }): Promise<ListNotesResult> {
    return this.repo.list({
      authorId: input.requesterId,
      cursor: input.cursor,
      limit: input.limit,
      includeDeleted: input.includeDeleted,
    })
  }
}
