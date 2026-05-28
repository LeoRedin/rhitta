import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId } from '@rhitta/contracts/notes'
import { beforeEach, describe, expect, test } from 'vitest'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { UpdateNoteUseCase } from '../application/update-note.js'
import { InMemoryNoteRepository } from '../infra/in-memory-note-repository.js'

function makeAuthor(): UserId {
  return randomUUID() as UserId
}

describe('UpdateNoteUseCase', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let createNote: CreateNoteUseCase
  let useCase: UpdateNoteUseCase

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    createNote = new CreateNoteUseCase(repo, events)
    useCase = new UpdateNoteUseCase(repo)
  })

  test('updates a note when requester is the author', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'old', body: 'old body' })
    const originalUpdatedAt = created.updatedAt.getTime()
    await new Promise((r) => setTimeout(r, 2))

    const updated = await useCase.execute({
      id: created.id,
      requesterId: authorId,
      title: 'new',
      body: 'new body',
    })

    expect(updated.id).toBe(created.id)
    expect(updated.title).toBe('new')
    expect(updated.body).toBe('new body')
    expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt)

    const reloaded = await repo.findById(created.id)
    expect(reloaded?.title).toBe('new')
    expect(reloaded?.body).toBe('new body')
  })

  test('allows partial updates (title only)', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'old', body: 'body' })

    const updated = await useCase.execute({
      id: created.id,
      requesterId: authorId,
      title: 'new',
    })

    expect(updated.title).toBe('new')
    expect(updated.body).toBe('body')
  })

  test('allows partial updates (body only)', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'title', body: 'old' })

    const updated = await useCase.execute({
      id: created.id,
      requesterId: authorId,
      body: 'new',
    })

    expect(updated.title).toBe('title')
    expect(updated.body).toBe('new')
  })

  test('throws NotFoundError when the note does not exist', async () => {
    const missingId = randomUUID() as NoteId
    await expect(
      useCase.execute({ id: missingId, requesterId: makeAuthor(), title: 'x' })
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test('throws ConflictError when updating a deleted note', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'doomed', body: '' })
    created.softDelete()
    await repo.save(created)

    await expect(
      useCase.execute({ id: created.id, requesterId: authorId, title: 'new' })
    ).rejects.toBeInstanceOf(ConflictError)
  })

  test('throws ForbiddenError when requester is not the author', async () => {
    const authorId = makeAuthor()
    const otherId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'private', body: '' })

    await expect(
      useCase.execute({ id: created.id, requesterId: otherId, title: 'pwned' })
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  test('throws ValidationError on invalid title and does not persist', async () => {
    const authorId = makeAuthor()
    const created = await createNote.execute({ authorId, title: 'old', body: 'old' })

    await expect(
      useCase.execute({ id: created.id, requesterId: authorId, title: '' })
    ).rejects.toBeInstanceOf(ValidationError)

    const reloaded = await repo.findById(created.id)
    expect(reloaded?.title).toBe('old')
  })
})
