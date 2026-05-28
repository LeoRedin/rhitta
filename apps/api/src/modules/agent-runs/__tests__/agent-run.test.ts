import { randomUUID } from 'node:crypto'
import type { AgentRunRequest } from '@rhitta/contracts/agent-runs'
import type { UserId } from '@rhitta/contracts/auth'
import { describe, expect, test } from 'vitest'
import { AgentRun } from '../domain/agent-run.js'

function makeUser(): UserId {
  return randomUUID() as UserId
}

function makeRequest(overrides: Partial<AgentRunRequest> = {}): AgentRunRequest {
  return {
    prompt: 'hello',
    model: 'claude-sonnet-4-6',
    maxTokens: 2048,
    ...overrides,
  }
}

describe('AgentRun.fromCompletion', () => {
  test('builds an entity with generated id, the supplied fields, and a fresh createdAt', () => {
    const userId = makeUser()
    const request = makeRequest({ prompt: 'hi', systemPrompt: 'be brief' })
    const before = Date.now()
    const run = AgentRun.fromCompletion({
      userId,
      request,
      output: 'hello back',
      inputTokens: 10,
      outputTokens: 4,
    })
    const after = Date.now()

    expect(run.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(run.userId).toBe(userId)
    expect(run.request).toBe(request)
    expect(run.output).toBe('hello back')
    expect(run.inputTokens).toBe(10)
    expect(run.outputTokens).toBe(4)
    expect(run.createdAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(run.createdAt.getTime()).toBeLessThanOrEqual(after)
  })

  test('generates a unique id per call', () => {
    const userId = makeUser()
    const a = AgentRun.fromCompletion({
      userId,
      request: makeRequest(),
      output: '',
      inputTokens: 0,
      outputTokens: 0,
    })
    const b = AgentRun.fromCompletion({
      userId,
      request: makeRequest(),
      output: '',
      inputTokens: 0,
      outputTokens: 0,
    })
    expect(a.id).not.toBe(b.id)
  })

  test('accepts zero token counts (e.g. empty completions)', () => {
    const run = AgentRun.fromCompletion({
      userId: makeUser(),
      request: makeRequest(),
      output: '',
      inputTokens: 0,
      outputTokens: 0,
    })
    expect(run.output).toBe('')
    expect(run.inputTokens).toBe(0)
    expect(run.outputTokens).toBe(0)
  })
})

describe('AgentRun.toDTO', () => {
  test('returns a plain object matching the wire shape', () => {
    const userId = makeUser()
    const request = makeRequest({ prompt: 'q', systemPrompt: 's' })
    const run = AgentRun.fromCompletion({
      userId,
      request,
      output: 'a',
      inputTokens: 1,
      outputTokens: 2,
    })

    expect(run.toDTO()).toEqual({
      id: run.id,
      userId,
      request,
      output: 'a',
      inputTokens: 1,
      outputTokens: 2,
      createdAt: run.createdAt,
    })
  })

  test('preserves the request reference exactly (no shallow mutation)', () => {
    const request = makeRequest({ prompt: 'orig' })
    const run = AgentRun.fromCompletion({
      userId: makeUser(),
      request,
      output: '',
      inputTokens: 0,
      outputTokens: 0,
    })
    const dto = run.toDTO()
    expect(dto.request).toEqual(request)
    expect(dto.request.prompt).toBe('orig')
  })
})
