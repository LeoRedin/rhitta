/**
 * Integration tests for `PATCH /notes/:id` (handler-level).
 *
 * Covers ownership enforcement, the soft-delete conflict path
 * (distinct from `GET`'s NotFound — see `update-note.ts` for the
 * reasoning), and validation at the wire boundary.
 */
import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { APIError, ErrCode } from 'encore.dev/api'
import { beforeEach, describe, expect, test } from 'vitest'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { UnauthorizedError } from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { UpdateNoteUseCase } from '../application/update-note.js'
import { updateImpl } from '../http/update.js'
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

describe('updateImpl (PATCH /notes/:id)', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let createNote: CreateNoteUseCase
  let useCase: UpdateNoteUseCase
  let user: { userId: UserId; email: string }

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    createNote = new CreateNoteUseCase(repo, events)
    useCase = new UpdateNoteUseCase(repo)
    user = { userId: randomUUID() as UserId, email: 'alice@example.com' }
  })

  test('happy path — updates title and body, returns refreshed note', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 'old', body: 'old' })

    const updated = await updateImpl(
      { id: created.id, title: 'new title', body: 'new body' },
      {
        authGate: new FakeAuthGate(user),
        updateNote: useCase,
        request: new Request('http://internal.local/'),
      }
    )

    expect(updated.id).toBe(created.id)
    expect(updated.title).toBe('new title')
    expect(updated.body).toBe('new body')
  })

  test('partial update — only title (body stays)', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 'old', body: 'keep' })

    const updated = await updateImpl(
      { id: created.id, title: 'changed' },
      {
        authGate: new FakeAuthGate(user),
        updateNote: useCase,
        request: new Request('http://internal.local/'),
      }
    )

    expect(updated.title).toBe('changed')
    expect(updated.body).toBe('keep')
  })

  test('returns 404 when the note does not exist', async () => {
    const error = await expectThrows(
      updateImpl(
        { id: randomUUID(), title: 'whatever' },
        {
          authGate: new FakeAuthGate(user),
          updateNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.NotFound)
  })

  test('returns 403 when requester is not the author', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 't', body: '' })
    const other: { userId: UserId; email: string } = {
      userId: randomUUID() as UserId,
      email: 'eve@example.com',
    }

    const error = await expectThrows(
      updateImpl(
        { id: created.id, title: 'hacked' },
        {
          authGate: new FakeAuthGate(other),
          updateNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.PermissionDenied)
  })

  test('returns 409 when the note is soft-deleted', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 't', body: '' })
    created.softDelete()
    await repo.save(created)

    const error = await expectThrows(
      updateImpl(
        { id: created.id, title: 'x' },
        {
          authGate: new FakeAuthGate(user),
          updateNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.AlreadyExists)
  })

  test('returns 400 when id is not a valid UUID', async () => {
    const error = await expectThrows(
      updateImpl(
        { id: 'bogus', title: 'x' },
        {
          authGate: new FakeAuthGate(user),
          updateNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
  })

  test('returns 400 when title violates schema (empty string)', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 't', body: '' })

    const error = await expectThrows(
      updateImpl(
        { id: created.id, title: '' },
        {
          authGate: new FakeAuthGate(user),
          updateNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
  })

  test('returns 401 when not authenticated', async () => {
    const error = await expectThrows(
      updateImpl(
        { id: randomUUID(), title: 'x' },
        {
          authGate: new RejectingAuthGate(),
          updateNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.Unauthenticated)
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
