import { beforeEach, describe, expect, test } from 'vitest'
import { InMemoryAgentAdapter } from '../infra/in-memory-agent-adapter.js'

describe('InMemoryAgentAdapter', () => {
  let adapter: InMemoryAgentAdapter

  beforeEach(() => {
    adapter = new InMemoryAgentAdapter()
  })

  test('records every call in `.calls`', async () => {
    await adapter.complete({ prompt: 'a', model: 'm', maxTokens: 1 })
    await adapter.complete({ prompt: 'b', model: 'm', maxTokens: 1 })

    expect(adapter.calls).toEqual([
      { prompt: 'a', model: 'm', maxTokens: 1 },
      { prompt: 'b', model: 'm', maxTokens: 1 },
    ])
  })

  test('returns the default placeholder response when none has been set', async () => {
    const result = await adapter.complete({ prompt: 'x', model: 'm', maxTokens: 1 })
    expect(result).toEqual({
      output: 'placeholder',
      inputTokens: 0,
      outputTokens: 0,
    })
  })

  test('setResponse swaps the response for the next call (and subsequent ones)', async () => {
    adapter.setResponse({ output: 'custom', inputTokens: 11, outputTokens: 22 })

    const first = await adapter.complete({ prompt: 'x', model: 'm', maxTokens: 1 })
    const second = await adapter.complete({ prompt: 'y', model: 'm', maxTokens: 1 })

    expect(first).toEqual({ output: 'custom', inputTokens: 11, outputTokens: 22 })
    expect(second).toEqual({ output: 'custom', inputTokens: 11, outputTokens: 22 })
  })

  test('passes the request through verbatim (no defaulting or coercion)', async () => {
    await adapter.complete({
      prompt: 'p',
      systemPrompt: 's',
      model: 'claude-sonnet-4-6',
      maxTokens: 512,
    })
    expect(adapter.calls[0]).toEqual({
      prompt: 'p',
      systemPrompt: 's',
      model: 'claude-sonnet-4-6',
      maxTokens: 512,
    })
  })
})
