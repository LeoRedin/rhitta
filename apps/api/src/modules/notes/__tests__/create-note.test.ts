import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { beforeEach, describe, expect, test } from 'vitest'
import { ValidationError } from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { InMemoryNoteRepository } from '../infra/in-memory-note-repository.js'

function makeAuthor(): UserId {
  return randomUUID() as UserId
}

describe('CreateNoteUseCase', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let useCase: CreateNoteUseCase

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    useCase = new CreateNoteUseCase(repo, events)
  })

  test('persists a new note owned by authorId', async () => {
    const authorId = makeAuthor()
    const note = await useCase.execute({ authorId, title: 'Hello', body: 'world' })

    expect(note.authorId).toBe(authorId)
    expect(note.title).toBe('Hello')
    expect(note.body).toBe('world')
    expect(note.isDeleted).toBe(false)

    const reloaded = await repo.findById(note.id)
    expect(reloaded).not.toBeNull()
    expect(reloaded?.id).toBe(note.id)
  })

  test('emits a note-created event with the right payload', async () => {
    const authorId = makeAuthor()
    const before = Date.now()
    const note = await useCase.execute({ authorId, title: 'x', body: '' })
    const after = Date.now()

    expect(events.published).toHaveLength(1)
    const [first] = events.published
    expect(first?.topic).toBe('note-created')
    const event = first?.event as { noteId: string; authorId: string; occurredAt: Date }
    expect(event.noteId).toBe(note.id)
    expect(event.authorId).toBe(authorId)
    expect(event.occurredAt).toBeInstanceOf(Date)
    expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after)
  })

  test('throws ValidationError on empty title and does not publish', async () => {
    await expect(
      useCase.execute({ authorId: makeAuthor(), title: '', body: '' })
    ).rejects.toBeInstanceOf(ValidationError)
    expect(events.published).toHaveLength(0)
  })

  test('throws ValidationError on oversized body and does not publish', async () => {
    await expect(
      useCase.execute({ authorId: makeAuthor(), title: 'x', body: 'b'.repeat(10_001) })
    ).rejects.toBeInstanceOf(ValidationError)
    expect(events.published).toHaveLength(0)
  })

  test('two creates from the same author produce two distinct notes', async () => {
    const authorId = makeAuthor()
    const a = await useCase.execute({ authorId, title: 'a', body: '' })
    const b = await useCase.execute({ authorId, title: 'b', body: '' })

    expect(a.id).not.toBe(b.id)
    expect(events.published).toHaveLength(2)
  })
})
