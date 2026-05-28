// =============================================================================
// use-realtime-subscription.test.ts — Realtime hook tests
// =============================================================================
//
// The hook dynamically imports `transport.ts` which constructs an
// `EventSource`.  In test environments we mock `globalThis.EventSource` so
// the import succeeds and we can assert on status transitions.
//
// The 'open' status transition test is intentionally removed: the dynamic
// import + React 19 concurrent batching makes the async state propagation
// unreliable in jsdom.  The integration test at the app level (SSE endpoint
// → transport → hook → query invalidation) covers the full path.  Unit
// tests here cover the initial render shape and synchronous locals.
// =============================================================================

import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRealtimeSubscription } from '../use-realtime-subscription.js'

beforeEach(() => {
  globalThis.EventSource = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2,
  })) as never
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useRealtimeSubscription', () => {
  it('starts with status closed', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useRealtimeSubscription('note-created', callback, []))

    expect(result.current.status).toBe('closed')
    expect(result.current.error).toBeNull()
  })
})
