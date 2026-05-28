/**
 * Integration tests for `GET /notes/:id` (handler-level). Validates the
 * belt-and-braces id parse, auth dispatch, and the mapping of domain
 * errors to APIError.
 */
import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { APIError, ErrCode } from 'encore.dev/api'
import { beforeEach, describe, expect, test } from 'vitest'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { UnauthorizedError } from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { GetNoteUseCase } from '../application/get-note.js'
import { getImpl } from '../http/get.js'
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

describe('getImpl (GET /notes/:id)', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let createNote: CreateNoteUseCase
  let useCase: GetNoteUseCase
  let user: { userId: UserId; email: string }

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    createNote = new CreateNoteUseCase(repo, events)
    useCase = new GetNoteUseCase(repo)
    user = { userId: randomUUID() as UserId, email: 'alice@example.com' }
  })

  test('happy path — returns the note when requester is the author', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 'hi', body: '' })

    const note = await getImpl(
      { id: created.id },
      {
        authGate: new FakeAuthGate(user),
        getNote: useCase,
        request: new Request('http://internal.local/'),
      }
    )

    expect(note.id).toBe(created.id)
    expect(note.title).toBe('hi')
  })

  test('returns 404 when the note does not exist', async () => {
    const error = await expectThrows(
      getImpl(
        { id: randomUUID() },
        {
          authGate: new FakeAuthGate(user),
          getNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.NotFound)
  })

  test('returns 403 when requester is not the author', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 'private', body: '' })
    const other: { userId: UserId; email: string } = {
      userId: randomUUID() as UserId,
      email: 'eve@example.com',
    }

    const error = await expectThrows(
      getImpl(
        { id: created.id },
        {
          authGate: new FakeAuthGate(other),
          getNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.PermissionDenied)
  })

  test('returns 401 when not authenticated', async () => {
    const error = await expectThrows(
      getImpl(
        { id: randomUUID() },
        {
          authGate: new RejectingAuthGate(),
          getNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.Unauthenticated)
  })

  test('returns 400 when id is not a valid UUID', async () => {
    const error = await expectThrows(
      getImpl(
        { id: 'not-a-uuid' },
        {
          authGate: new FakeAuthGate(user),
          getNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
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
