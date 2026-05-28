import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { beforeEach, describe, expect, test } from 'vitest'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { ListNotesUseCase } from '../application/list-notes.js'
import { InMemoryNoteRepository } from '../infra/in-memory-note-repository.js'

function makeAuthor(): UserId {
  return randomUUID() as UserId
}

/** Seed `count` notes for `authorId` with monotonically increasing createdAt. */
async function seedNotes(
  createNote: CreateNoteUseCase,
  authorId: UserId,
  count: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await createNote.execute({ authorId, title: `note ${i}`, body: '' })
    // Tiny delay so createdAt differs and ordering is well-defined.
    await new Promise((r) => setTimeout(r, 2))
  }
}

describe('ListNotesUseCase', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let createNote: CreateNoteUseCase
  let useCase: ListNotesUseCase

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    createNote = new CreateNoteUseCase(repo, events)
    useCase = new ListNotesUseCase(repo)
  })

  test('returns empty result when no notes exist', async () => {
    const result = await useCase.execute({
      requesterId: makeAuthor(),
      limit: 20,
      includeDeleted: false,
    })
    expect(result.items).toEqual([])
    expect(result.nextCursor).toBeNull()
  })

  test('orders notes by createdAt desc', async () => {
    const authorId = makeAuthor()
    await seedNotes(createNote, authorId, 3)

    const result = await useCase.execute({
      requesterId: authorId,
      limit: 20,
      includeDeleted: false,
    })

    expect(result.items).toHaveLength(3)
    expect(result.items[0]?.title).toBe('note 2')
    expect(result.items[1]?.title).toBe('note 1')
    expect(result.items[2]?.title).toBe('note 0')
    expect(result.nextCursor).toBeNull()
  })

  test('paginates with cursor when there are more items than limit', async () => {
    const authorId = makeAuthor()
    await seedNotes(createNote, authorId, 5)

    const first = await useCase.execute({
      requesterId: authorId,
      limit: 2,
      includeDeleted: false,
    })
    expect(first.items).toHaveLength(2)
    expect(first.items[0]?.title).toBe('note 4')
    expect(first.items[1]?.title).toBe('note 3')
    expect(first.nextCursor).not.toBeNull()
    expect(first.nextCursor).toBe(first.items[1]?.id)

    const second = await useCase.execute({
      requesterId: authorId,
      cursor: first.nextCursor ?? undefined,
      limit: 2,
      includeDeleted: false,
    })
    expect(second.items).toHaveLength(2)
    expect(second.items[0]?.title).toBe('note 2')
    expect(second.items[1]?.title).toBe('note 1')
    expect(second.nextCursor).toBe(second.items[1]?.id)

    const third = await useCase.execute({
      requesterId: authorId,
      cursor: second.nextCursor ?? undefined,
      limit: 2,
      includeDeleted: false,
    })
    expect(third.items).toHaveLength(1)
    expect(third.items[0]?.title).toBe('note 0')
    expect(third.nextCursor).toBeNull()
  })

  test('returns nextCursor === null when the page exactly drains the result set', async () => {
    const authorId = makeAuthor()
    await seedNotes(createNote, authorId, 2)
    const result = await useCase.execute({
      requesterId: authorId,
      limit: 2,
      includeDeleted: false,
    })
    expect(result.items).toHaveLength(2)
    expect(result.nextCursor).toBeNull()
  })

  test('isolates notes by author', async () => {
    const alice = makeAuthor()
    const bob = makeAuthor()
    await createNote.execute({ authorId: alice, title: 'alice 1', body: '' })
    await createNote.execute({ authorId: bob, title: 'bob 1', body: '' })
    await createNote.execute({ authorId: alice, title: 'alice 2', body: '' })

    const aliceList = await useCase.execute({
      requesterId: alice,
      limit: 20,
      includeDeleted: false,
    })
    const bobList = await useCase.execute({
      requesterId: bob,
      limit: 20,
      includeDeleted: false,
    })

    expect(aliceList.items).toHaveLength(2)
    expect(aliceList.items.every((n) => n.authorId === alice)).toBe(true)
    expect(bobList.items).toHaveLength(1)
    expect(bobList.items[0]?.authorId).toBe(bob)
  })

  test('excludes soft-deleted notes by default', async () => {
    const authorId = makeAuthor()
    const a = await createNote.execute({ authorId, title: 'live', body: '' })
    const b = await createNote.execute({ authorId, title: 'doomed', body: '' })
    b.softDelete()
    await repo.save(b)

    const result = await useCase.execute({
      requesterId: authorId,
      limit: 20,
      includeDeleted: false,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.id).toBe(a.id)
  })

  test('includes soft-deleted notes when includeDeleted is true', async () => {
    const authorId = makeAuthor()
    await createNote.execute({ authorId, title: 'live', body: '' })
    const b = await createNote.execute({ authorId, title: 'doomed', body: '' })
    b.softDelete()
    await repo.save(b)

    const result = await useCase.execute({
      requesterId: authorId,
      limit: 20,
      includeDeleted: true,
    })

    expect(result.items).toHaveLength(2)
  })
})
