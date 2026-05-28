/**
 * Integration tests for `POST /notes` — exercise the plain `createImpl`
 * function with hand-rolled deps so we don't have to spin up the Encore
 * runtime. The `api(...)` wrapper is just glue; the impl is where the
 * belt-and-braces validation, auth dispatch, and event publishing
 * actually live.
 */
import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import type { NoteId } from '@rhitta/contracts/notes'
import { APIError, ErrCode } from 'encore.dev/api'
import { beforeEach, describe, expect, test } from 'vitest'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { UnauthorizedError } from '../../../lib/errors.js'
import { InMemoryEventPublisher } from '../../../lib/pub-sub.js'
import { CreateNoteUseCase } from '../application/create-note.js'
import { createImpl } from '../http/create.js'
import { InMemoryNoteRepository } from '../infra/in-memory-note-repository.js'

/** Stand-in `AuthGate` whose return value is fixed by the test. */
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

describe('createImpl (POST /notes)', () => {
  let repo: InMemoryNoteRepository
  let events: InMemoryEventPublisher
  let useCase: CreateNoteUseCase
  let user: { userId: UserId; email: string }

  beforeEach(() => {
    repo = new InMemoryNoteRepository()
    events = new InMemoryEventPublisher()
    useCase = new CreateNoteUseCase(repo, events)
    user = { userId: randomUUID() as UserId, email: 'alice@example.com' }
  })

  test('happy path — returns the created note and publishes note-created', async () => {
    const note = await createImpl(
      { title: 'Hello', body: 'world' },
      {
        authGate: new FakeAuthGate(user),
        createNote: useCase,
        request: new Request('http://internal.local/'),
      }
    )

    expect(note.title).toBe('Hello')
    expect(note.body).toBe('world')
    expect(note.authorId).toBe(user.userId)
    expect(note.deletedAt).toBeNull()

    // Persisted (note.id is wire-typed `string`; the repo expects branded NoteId)
    expect(await repo.findById(note.id as NoteId)).not.toBeNull()

    // Event emitted with the right payload
    expect(events.published).toHaveLength(1)
    const [first] = events.published
    expect(first?.topic).toBe('note-created')
    const event = first?.event as { noteId: string; authorId: string; occurredAt: Date }
    expect(event.noteId).toBe(note.id)
    expect(event.authorId).toBe(user.userId)
  })

  test('rejects unauthenticated request with 401 — does not publish', async () => {
    const error = await expectThrows(
      createImpl(
        { title: 'x', body: '' },
        {
          authGate: new RejectingAuthGate(),
          createNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.Unauthenticated)
    expect(events.published).toHaveLength(0)
  })

  test('invalid input — empty title — surfaces as 400 invalidArgument', async () => {
    const error = await expectThrows(
      createImpl(
        // Intentionally invalid: empty title fails `CreateNoteSchema.parse`.
        { title: '', body: '' },
        {
          authGate: new FakeAuthGate(user),
          createNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
    expect(events.published).toHaveLength(0)
  })

  test('domain validation (oversized body) also surfaces as 400', async () => {
    const error = await expectThrows(
      createImpl(
        { title: 'ok', body: 'b'.repeat(10_001) },
        {
          authGate: new FakeAuthGate(user),
          createNote: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
    expect(events.published).toHaveLength(0)
  })
})

/** Run `p`, expect it to reject, return the rejection value. */
async function expectThrows(p: Promise<unknown>): Promise<unknown> {
  try {
    await p
  } catch (e) {
    return e
  }
  throw new Error('expected promise to reject')
}
