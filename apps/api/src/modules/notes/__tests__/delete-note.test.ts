import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId } from '@rhitta/contracts/notes'
import { beforeEach, describe, expect, test } from 'vitest'
import { ForbiddenError, NotFoundError } from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { DeleteNoteUseCase } from '../application/delete-note.js'
import { InMemoryNoteRepository } from '../infra/in-memory-note-repository.js'

function makeAuthor(): UserId {
  return randomUUID() as UserId
}

describe('DeleteNoteUseCase', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let createNote: CreateNoteUseCase
  let useCase: DeleteNoteUseCase

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    createNote = new CreateNoteUseCase(repo, events)
    useCase = new DeleteNoteUseCase(repo)
  })

  test('soft-deletes the note (deletedAt set, still findable in the store)', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'x', body: '' })

    await useCase.execute({ id: created.id, requesterId: authorId })

    const reloaded = await repo.findById(created.id)
    expect(reloaded).not.toBeNull()
    expect(reloaded?.isDeleted).toBe(true)
    expect(reloaded?.deletedAt).toBeInstanceOf(Date)
  })

  test('throws NotFoundError when the note does not exist', async () => {
    const missingId = randomUUID() as NoteId
    await expect(
      useCase.execute({ id: missingId, requesterId: makeAuthor() })
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test('throws NotFoundError when the note is already soft-deleted', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'x', body: '' })
    await useCase.execute({ id: created.id, requesterId: authorId })

    await expect(useCase.execute({ id: created.id, requesterId: authorId })).rejects.toBeInstanceOf(
      NotFoundError
    )
  })

  test('throws ForbiddenError when requester is not the author', async () => {
    const authorId = makeAuthor()
    const otherId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'private', body: '' })

    await expect(useCase.execute({ id: created.id, requesterId: otherId })).rejects.toBeInstanceOf(
      ForbiddenError
    )

    // And the note remains undeleted.
    const reloaded = await repo.findById(created.id)
    expect(reloaded?.isDeleted).toBe(false)
  })
})
