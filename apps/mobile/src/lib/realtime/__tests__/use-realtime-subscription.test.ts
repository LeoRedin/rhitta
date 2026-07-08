// =============================================================================
// use-realtime-subscription.test.ts — Realtime hook tests
// =============================================================================
//
// The hook dynamically imports `transport.ts` which uses `fetch` + a
// ReadableStream reader. In test environments we mock `globalThis.fetch` so
// the import resolves without triggering a real network call.
//
// The 'open' / 'connecting' status transition tests are intentionally
// omitted: the dynamic import + React concurrent batching makes async state
// propagation unreliable in a unit test runner. Integration tests at the app
// level (SSE endpoint -> transport -> hook -> query invalidation) cover the
// full path. Unit tests here cover the initial render shape and synchronous
// locals.
// =============================================================================

import { describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react-native'
import { useRealtimeSubscription } from '../use-realtime-subscription'

beforeEach(() => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve(
      new Response(null, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    )
  )
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('useRealtimeSubscription', () => {
  it('starts with status closed and no error', async () => {
    const callback = jest.fn()
    const { result } = renderHook(() => useRealtimeSubscription('note-created', callback, []))

    expect(result.current.status).toBe('closed')
    expect(result.current.error).toBeNull()

    // The mount effect kicks off an async dynamic import of the transport, whose
    // settlement schedules a state update. Flush those pending microtasks/timers
    // inside act() so the trailing update lands here instead of after the test
    // (which triggers React's "not wrapped in act(...)" warning).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  })
})
