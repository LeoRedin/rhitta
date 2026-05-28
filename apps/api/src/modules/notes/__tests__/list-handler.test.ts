/**
 * Integration tests for `GET /notes` (handler-level). Covers default
 * query parsing (limit/includeDeleted), cursor pagination at the wire
 * boundary, isolation by requester, and auth.
 */
import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { APIError, ErrCode } from 'encore.dev/api'
import { beforeEach, describe, expect, test } from 'vitest'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { UnauthorizedError } from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { ListNotesUseCase } from '../application/list-notes.js'
import { listImpl } from '../http/list.js'
import { InMemoryNoteRepository } from '../infra/in-memory-note-repository.js'

class FakeAuthGate implements AuthGate {
  constructor(private readonly user: { userId: UserId; email: string }) {}
  async getCurrentUser(): Promise<{ userId: UserId; email: string }> {
    return this.user
  }
}

class RejectingAuthGate implements AuthGate {
  async getCurrentUser(): Promise<never> {
    throw new UnauthorizedError('no session')
  }
}

describe('listImpl (GET /notes)', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let createNote: CreateNoteUseCase
  let useCase: ListNotesUseCase
  let user: { userId: UserId; email: string }

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    createNote = new CreateNoteUseCase(repo, events)
    useCase = new ListNotesUseCase(repo)
    user = { userId: randomUUID() as UserId, email: 'alice@example.com' }
  })

  test('happy path — empty payload uses schema defaults (limit=20, includeDeleted=false)', async () => {
    await createNote.execute({ authorId: user.userId, title: 'a', body: '' })
    await createNote.execute({ authorId: user.userId, title: 'b', body: '' })

    const response = await listImpl(
      {},
      {
        authGate: new FakeAuthGate(user),
        listNotes: useCase,
        request: new Request('http://internal.local/'),
      }
    )

    expect(response.items).toHaveLength(2)
    expect(response.nextCursor).toBeNull()
  })

  test('paginates via cursor when there are more items than limit', async () => {
    for (let i = 0; i < 5; i++) {
      await createNote.execute({ authorId: user.userId, title: `n${i}`, body: '' })
      await new Promise((r) => setTimeout(r, 2))
    }

    const page1 = await listImpl(
      { limit: 2 },
      {
        authGate: new FakeAuthGate(user),
        listNotes: useCase,
        request: new Request('http://internal.local/'),
      }
    )
    expect(page1.items).toHaveLength(2)
    expect(page1.nextCursor).not.toBeNull()

    const page2 = await listImpl(
      { limit: 2, cursor: page1.nextCursor ?? undefined },
      {
        authGate: new FakeAuthGate(user),
        listNotes: useCase,
        request: new Request('http://internal.local/'),
      }
    )
    expect(page2.items).toHaveLength(2)
    expect(page2.items[0]?.id).not.toBe(page1.items[0]?.id)
  })

  test('isolates notes by requester', async () => {
    const bob: { userId: UserId; email: string } = {
      userId: randomUUID() as UserId,
      email: 'bob@example.com',
    }
    await createNote.execute({ authorId: user.userId, title: 'alice', body: '' })
    await createNote.execute({ authorId: bob.userId, title: 'bob', body: '' })

    const aliceList = await listImpl(
      {},
      {
        authGate: new FakeAuthGate(user),
        listNotes: useCase,
        request: new Request('http://internal.local/'),
      }
    )
    expect(aliceList.items).toHaveLength(1)
    expect(aliceList.items[0]?.title).toBe('alice')
  })

  test('returns 401 when not authenticated', async () => {
    const error = await expectThrows(
      listImpl(
        {},
        {
          authGate: new RejectingAuthGate(),
          listNotes: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.Unauthenticated)
  })

  test('returns 400 when limit is invalid (negative)', async () => {
    const error = await expectThrows(
      // Cast through unknown because the type forbids this — we're
      // testing that runtime validation catches the wire-level bypass.
      listImpl({ limit: -1 } as unknown as Parameters<typeof listImpl>[0], {
        authGate: new FakeAuthGate(user),
        listNotes: useCase,
        request: new Request('http://internal.local/'),
      })
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
  })

  test('includeDeleted=true returns soft-deleted notes too', async () => {
    const a = await createNote.execute({ authorId: user.userId, title: 'live', body: '' })
    const b = await createNote.execute({ authorId: user.userId, title: 'doomed', body: '' })
    b.softDelete()
    await repo.save(b)

    const without = await listImpl(
      {},
      {
        authGate: new FakeAuthGate(user),
        listNotes: useCase,
        request: new Request('http://internal.local/'),
      }
    )
    expect(without.items).toHaveLength(1)
    expect(without.items[0]?.id).toBe(a.id)

    const withDeleted = await listImpl(
      { includeDeleted: true },
      {
        authGate: new FakeAuthGate(user),
        listNotes: useCase,
        request: new Request('http://internal.local/'),
      }
    )
    expect(withDeleted.items).toHaveLength(2)
  })
})

async function expectThrows(p: Promise<unknown>): Promise<unknown> {
  try {
    await p
  } catch (e) {
    return e
  }
  throw new Error('expected promise to reject')
}
