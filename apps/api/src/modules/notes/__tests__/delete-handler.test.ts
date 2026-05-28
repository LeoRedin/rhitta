/**
 * Integration tests for `DELETE /notes/:id` (handler-level). Confirms
 * soft-delete persistence, ownership enforcement, and the NotFound /
 * Unauthorized / InvalidArgument paths at the wire boundary.
 */
import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { APIError, ErrCode } from 'encore.dev/api'
import { beforeEach, describe, expect, test } from 'vitest'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { UnauthorizedError } from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { DeleteNoteUseCase } from '../application/delete-note.js'
import { deleteImpl } from '../http/delete.js'
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

describe('deleteImpl (DELETE /notes/:id)', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let createNote: CreateNoteUseCase
  let useCase: DeleteNoteUseCase
  let user: { userId: UserId; email: string }

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    createNote = new CreateNoteUseCase(repo, events)
    useCase = new DeleteNoteUseCase(repo)
    user = { userId: randomUUID() as UserId, email: 'alice@example.com' }
  })

  test('happy path — soft-deletes the note and returns void', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 'x', body: '' })

    const result = await deleteImpl(
      { id: created.id },
      {
        authGate: new FakeAuthGate(user),
        deleteNote: useCase,
        request: new Request('http://internal.local/'),
      }
    )
    expect(result).toBeUndefined()

    // Persisted as soft-deleted (not removed from the store).
    const reloaded = await repo.findById(created.id)
    expect(reloaded).not.toBeNull()
    expect(reloaded?.isDeleted).toBe(true)
  })

  test('returns 404 when the note does not exist', async () => {
    const error = await expectThrows(
      deleteImpl(
        { id: randomUUID() },
        {
          authGate: new FakeAuthGate(user),
          deleteNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.NotFound)
  })

  test('returns 404 when the note is already soft-deleted (no leak)', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 'x', body: '' })
    created.softDelete()
    await repo.save(created)

    const error = await expectThrows(
      deleteImpl(
        { id: created.id },
        {
          authGate: new FakeAuthGate(user),
          deleteNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.NotFound)
  })

  test('returns 403 when requester is not the author', async () => {
    const created = await createNote.execute({ authorId: user.userId, title: 'x', body: '' })
    const other: { userId: UserId; email: string } = {
      userId: randomUUID() as UserId,
      email: 'eve@example.com',
    }

    const error = await expectThrows(
      deleteImpl(
        { id: created.id },
        {
          authGate: new FakeAuthGate(other),
          deleteNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.PermissionDenied)
  })

  test('returns 401 when not authenticated', async () => {
    const error = await expectThrows(
      deleteImpl(
        { id: randomUUID() },
        {
          authGate: new RejectingAuthGate(),
          deleteNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.Unauthenticated)
  })

  test('returns 400 when id is not a valid UUID', async () => {
    const error = await expectThrows(
      deleteImpl(
        { id: 'not-a-uuid' },
        {
          authGate: new FakeAuthGate(user),
          deleteNote: useCase,
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
