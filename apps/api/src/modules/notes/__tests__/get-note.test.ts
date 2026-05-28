import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId } from '@rhitta/contracts/notes'
import { beforeEach, describe, expect, test } from 'vitest'
import { ForbiddenError, NotFoundError } from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { GetNoteUseCase } from '../application/get-note.js'
import { InMemoryNoteRepository } from '../infra/in-memory-note-repository.js'

function makeAuthor(): UserId {
  return randomUUID() as UserId
}

describe('GetNoteUseCase', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let createNote: CreateNoteUseCase
  let useCase: GetNoteUseCase

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    createNote = new CreateNoteUseCase(repo, events)
    useCase = new GetNoteUseCase(repo)
  })

  test('returns the note when requester is the author', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'hi', body: '' })

    const note = await useCase.execute({ id: created.id, requesterId: authorId })

    expect(note.id).toBe(created.id)
    expect(note.title).toBe('hi')
  })

  test('throws NotFoundError when the note does not exist', async () => {
    const missingId = randomUUID() as NoteId
    await expect(
      useCase.execute({ id: missingId, requesterId: makeAuthor() })
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test('throws NotFoundError when the note is soft-deleted (deletion not leaked)', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'x', body: '' })
    created.softDelete()
    await repo.save(created)

    await expect(useCase.execute({ id: created.id, requesterId: authorId })).rejects.toBeInstanceOf(
      NotFoundError
    )
  })

  test('throws ForbiddenError when requester is not the author', async () => {
    const authorId = makeAuthor()
    const otherUserId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'private', body: '' })

    await expect(
      useCase.execute({ id: created.id, requesterId: otherUserId })
    ).rejects.toBeInstanceOf(ForbiddenError)
  })
})
