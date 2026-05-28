import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { beforeEach, describe, expect, test } from 'vitest'
import { RunAgentUseCase } from '../application/run-agent.js'
import { InMemoryAgentAdapter } from '../infra/in-memory-agent-adapter.js'

function makeUser(): UserId {
  return randomUUID() as UserId
}

describe('RunAgentUseCase', () => {
  let provider: InMemoryAgentAdapter
  let useCase: RunAgentUseCase

  beforeEach(() => {
    provider = new InMemoryAgentAdapter()
    useCase = new RunAgentUseCase(provider)
  })

  test('forwards the request fields (no userId) to the provider', async () => {
    const userId = makeUser()
    await useCase.execute({
      userId,
      prompt: 'hello',
      systemPrompt: 'be brief',
      model: 'claude-sonnet-4-6',
      maxTokens: 1024,
    })

    expect(provider.calls).toHaveLength(1)
    const [call] = provider.calls
    expect(call).toEqual({
      prompt: 'hello',
      systemPrompt: 'be brief',
      model: 'claude-sonnet-4-6',
      maxTokens: 1024,
    })
    // userId is intentionally stripped before being sent to the provider.
    expect(call as Record<string, unknown>).not.toHaveProperty('userId')
  })

  test('returns an AgentRun built from the provider completion + caller userId', async () => {
    provider.setResponse({ output: 'hi there', inputTokens: 7, outputTokens: 3 })
    const userId = makeUser()

    const run = await useCase.execute({
      userId,
      prompt: 'hi',
      model: 'claude-sonnet-4-6',
      maxTokens: 256,
    })

    expect(run.userId).toBe(userId)
    expect(run.output).toBe('hi there')
    expect(run.inputTokens).toBe(7)
    expect(run.outputTokens).toBe(3)
    expect(run.request).toEqual({
      prompt: 'hi',
      model: 'claude-sonnet-4-6',
      maxTokens: 256,
    })
  })

  test('two runs from the same user produce two distinct AgentRuns', async () => {
    const userId = makeUser()
    const a = await useCase.execute({
      userId,
      prompt: 'one',
      model: 'claude-sonnet-4-6',
      maxTokens: 256,
    })
    const b = await useCase.execute({
      userId,
      prompt: 'two',
      model: 'claude-sonnet-4-6',
      maxTokens: 256,
    })

    expect(a.id).not.toBe(b.id)
    expect(provider.calls).toHaveLength(2)
  })

  test('propagates provider failures (no swallowing)', async () => {
    class FailingProvider extends InMemoryAgentAdapter {
      override async complete(): Promise<never> {
        throw new Error('boom')
      }
    }
    const failing = new FailingProvider()
    const failingUseCase = new RunAgentUseCase(failing)

    await expect(
      failingUseCase.execute({
        userId: makeUser(),
        prompt: 'x',
        model: 'claude-sonnet-4-6',
        maxTokens: 256,
      })
    ).rejects.toThrow('boom')
  })
})
