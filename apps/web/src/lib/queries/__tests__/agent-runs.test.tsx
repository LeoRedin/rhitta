// =============================================================================
// agent-runs.test.tsx — TanStack Query wrapper for agent runs (Task 6).
// =============================================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Client } from '../../api-client/index.js'
import { useRunAgent } from '../agent-runs.js'
import { setApiClientForTesting } from '../client.js'

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

afterEach(() => {
  setApiClientForTesting(null)
  vi.clearAllMocks()
})

describe('useRunAgent', () => {
  it('calls the Encore client with the request and returns the response', async () => {
    const response = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      request: {
        prompt: 'Hello',
        model: 'claude-sonnet-4-6',
        maxTokens: 2048,
      },
      output: 'Hi there.',
      inputTokens: 5,
      outputTokens: 3,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    }
    const run = vi.fn().mockResolvedValue(response)
    const mockClient = {
      notes: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      agentRuns: { run },
    }
    setApiClientForTesting(mockClient as unknown as Client)

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const { result } = renderHook(() => useRunAgent(), { wrapper: makeWrapper(qc) })

    const request = {
      prompt: 'Hello',
      model: 'claude-sonnet-4-6',
      maxTokens: 2048,
    }
    result.current.mutate(request)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(run).toHaveBeenCalledWith(request)
    expect(result.current.data).toEqual(response)
  })
})
