/**
 * Integration tests for `POST /agent-runs` — exercise the plain
 * `runImpl` function with hand-rolled deps so we don't spin up the
 * Encore runtime. The `api(...)` wrapper is just glue; the impl is
 * where belt-and-braces validation, auth dispatch, and the use-case
 * call actually live.
 */
import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { APIError, ErrCode } from 'encore.dev/api'
import { beforeEach, describe, expect, test } from 'vitest'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { UnauthorizedError } from '../../../lib/errors.js'
import { RunAgentUseCase } from '../application/run-agent.js'
import { runImpl } from '../http/run.js'
import { InMemoryAgentAdapter } from '../infra/in-memory-agent-adapter.js'

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

describe('runImpl (POST /agent-runs)', () => {
  let provider: InMemoryAgentAdapter
  let useCase: RunAgentUseCase
  let user: { userId: UserId; email: string }

  beforeEach(() => {
    provider = new InMemoryAgentAdapter()
    useCase = new RunAgentUseCase(provider)
    user = { userId: randomUUID() as UserId, email: 'alice@example.com' }
  })

  test('happy path — returns AgentRunResponse and records a single provider call', async () => {
    provider.setResponse({ output: 'hello back', inputTokens: 5, outputTokens: 3 })

    const result = await runImpl(
      {
        prompt: 'hello',
        systemPrompt: 'be brief',
        model: 'claude-sonnet-4-6',
        maxTokens: 1024,
      },
      {
        authGate: new FakeAuthGate(user),
        runAgent: useCase,
        request: new Request('http://internal.local/'),
      }
    )

    expect(result.userId).toBe(user.userId)
    expect(result.output).toBe('hello back')
    expect(result.inputTokens).toBe(5)
    expect(result.outputTokens).toBe(3)
    expect(result.request).toEqual({
      prompt: 'hello',
      systemPrompt: 'be brief',
      model: 'claude-sonnet-4-6',
      maxTokens: 1024,
    })
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(result.createdAt).toBeInstanceOf(Date)

    expect(provider.calls).toHaveLength(1)
  })

  test('applies schema defaults — model and maxTokens fill in when omitted', async () => {
    const result = await runImpl(
      // model + maxTokens have defaults in AgentRunRequestSchema.
      { prompt: 'just the prompt' } as unknown as Parameters<typeof runImpl>[0],
      {
        authGate: new FakeAuthGate(user),
        runAgent: useCase,
        request: new Request('http://internal.local/'),
      }
    )

    expect(result.request.model).toBe('claude-sonnet-4-6')
    expect(result.request.maxTokens).toBe(2048)
  })

  test('rejects unauthenticated request with 401 — does not call the provider', async () => {
    const error = await expectThrows(
      runImpl(
        { prompt: 'x', model: 'claude-sonnet-4-6', maxTokens: 256 },
        {
          authGate: new RejectingAuthGate(),
          runAgent: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.Unauthenticated)
    expect(provider.calls).toHaveLength(0)
  })

  test('invalid input — empty prompt — surfaces as 400 invalidArgument', async () => {
    const error = await expectThrows(
      runImpl(
        // Intentionally invalid: prompt min length is 1.
        { prompt: '', model: 'claude-sonnet-4-6', maxTokens: 256 },
        {
          authGate: new FakeAuthGate(user),
          runAgent: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
    expect(provider.calls).toHaveLength(0)
  })

  test('invalid input — maxTokens above the cap — surfaces as 400 invalidArgument', async () => {
    const error = await expectThrows(
      runImpl(
        { prompt: 'ok', model: 'claude-sonnet-4-6', maxTokens: 99_999 },
        {
          authGate: new FakeAuthGate(user),
          runAgent: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
    expect(provider.calls).toHaveLength(0)
  })

  test('invalid input — oversized prompt — surfaces as 400 invalidArgument', async () => {
    const error = await expectThrows(
      runImpl(
        { prompt: 'p'.repeat(50_001), model: 'claude-sonnet-4-6', maxTokens: 256 },
        {
          authGate: new FakeAuthGate(user),
          runAgent: useCase,
          request: new Request('http://internal.local/'),
        }
      )
    )

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).code).toBe(ErrCode.InvalidArgument)
    expect(provider.calls).toHaveLength(0)
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
