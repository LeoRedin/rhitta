// =============================================================================
// notes.test.tsx — TanStack Query wrappers for notes (Phase 2b Task 6).
// =============================================================================
//
// Each test mounts a wrapper component with `QueryClientProvider` + a
// mocked Encore client installed via `setApiClientForTesting`. The mock
// is reset between tests so cross-contamination is impossible.
// =============================================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Client } from '../../api-client/index.js'
import { setApiClientForTesting } from '../client.js'
import { queryKeys } from '../keys.js'
import { useCreateNote, useDeleteNote, useNote, useNotes, useUpdateNote } from '../notes.js'

type MockClient = Pick<Client, 'notes' | 'agentRuns'>

function buildMockClient(overrides: Partial<Client['notes']> = {}): MockClient {
  const noop = vi.fn()
  return {
    notes: {
      list: overrides.list ?? noop,
      get: overrides.get ?? noop,
      create: overrides.create ?? noop,
      update: overrides.update ?? noop,
      delete: overrides.delete ?? noop,
    } as Client['notes'],
    agentRuns: {
      run: vi.fn(),
    } as Client['agentRuns'],
  }
}

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

function makeNote(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    authorId: '22222222-2222-2222-2222-222222222222',
    title: 'Hello',
    body: 'World',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  }
}

afterEach(() => {
  setApiClientForTesting(null)
  vi.clearAllMocks()
})

describe('useNotes', () => {
  it('returns items after the mocked client resolves', async () => {
    const items = [makeNote()]
    const list = vi.fn().mockResolvedValue({ items, nextCursor: null })
    setApiClientForTesting(buildMockClient({ list }) as unknown as Client)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { result } = renderHook(() => useNotes(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toEqual(items)
    expect(list).toHaveBeenCalledWith({ limit: 20, includeDeleted: false })
  })

  it('uses distinct cache keys for distinct param objects', async () => {
    const list = vi.fn().mockResolvedValue({ items: [], nextCursor: null })
    setApiClientForTesting(buildMockClient({ list }) as unknown as Client)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { result: r1 } = renderHook(() => useNotes({ limit: 10 }), {
      wrapper: makeWrapper(qc),
    })
    const { result: r2 } = renderHook(() => useNotes({ limit: 50 }), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(r1.current.isSuccess).toBe(true))
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    // Two distinct keys => two fetches, not one shared cache hit.
    expect(list).toHaveBeenCalledTimes(2)
    expect(qc.getQueryCache().getAll().length).toBe(2)
  })
})

describe('useNote', () => {
  it('is disabled when id is undefined', () => {
    const get = vi.fn()
    setApiClientForTesting(buildMockClient({ get }) as unknown as Client)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { result } = renderHook(() => useNote(undefined), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isFetching).toBe(false)
    expect(result.current.isPending).toBe(true)
    expect(get).not.toHaveBeenCalled()
  })

  it('fetches the note when id is provided', async () => {
    const note = makeNote()
    const get = vi.fn().mockResolvedValue(note)
    setApiClientForTesting(buildMockClient({ get }) as unknown as Client)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { result } = renderHook(() => useNote(note.id), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(note)
    expect(get).toHaveBeenCalledWith(note.id)
  })
})

describe('useCreateNote', () => {
  it('invalidates the notes list cache on success', async () => {
    const note = makeNote()
    const create = vi.fn().mockResolvedValue(note)
    setApiClientForTesting(buildMockClient({ create }) as unknown as Client)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateNote(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ title: 'Hi', body: 'There' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(create).toHaveBeenCalledWith({ title: 'Hi', body: 'There' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.notes.all })
  })
})

describe('useUpdateNote', () => {
  it('updates the detail cache and invalidates lists on success', async () => {
    const updated = makeNote({ title: 'Renamed' })
    const update = vi.fn().mockResolvedValue(updated)
    setApiClientForTesting(buildMockClient({ update }) as unknown as Client)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateNote(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: updated.id, title: 'Renamed' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(update).toHaveBeenCalledWith({ id: updated.id, title: 'Renamed' })
    expect(qc.getQueryData(queryKeys.notes.detail(updated.id))).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.notes.all })
  })
})

describe('useDeleteNote', () => {
  it('removes the detail entry and invalidates lists on success', async () => {
    const note = makeNote()
    const del = vi.fn().mockResolvedValue(undefined)
    setApiClientForTesting(buildMockClient({ delete: del }) as unknown as Client)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    // Seed the detail cache so we can verify removeQueries clears it.
    qc.setQueryData(queryKeys.notes.detail(note.id), note)
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteNote(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(note.id)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(del).toHaveBeenCalledWith(note.id)
    expect(qc.getQueryData(queryKeys.notes.detail(note.id))).toBeUndefined()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.notes.all })
  })
})
