// =============================================================================
// use-toast-queue.test.ts — Zustand toast queue coverage (Phase 2b Task 8).
// =============================================================================
//
// Pure in-memory store. We reset the queue between tests and verify
// defaults, push/dismiss semantics, and id uniqueness.
// =============================================================================

import { beforeEach, describe, expect, it } from '@jest/globals'
import { useToastQueue } from '../use-toast-queue'

beforeEach(() => {
  useToastQueue.setState({ toasts: [] })
})

describe('useToastQueue', () => {
  it('starts with an empty queue', () => {
    expect(useToastQueue.getState().toasts).toEqual([])
  })

  it('push() appends a toast and returns its id', () => {
    const id = useToastQueue.getState().push({ title: 'Saved' })
    const { toasts } = useToastQueue.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]?.id).toBe(id)
    expect(toasts[0]?.title).toBe('Saved')
  })

  it('push() defaults variant to "info" and duration to 5000', () => {
    useToastQueue.getState().push({ title: 'Heads up' })
    const toast = useToastQueue.getState().toasts[0]
    expect(toast?.variant).toBe('info')
    expect(toast?.duration).toBe(5000)
  })

  it('dismiss(id) removes only the matching toast', () => {
    const a = useToastQueue.getState().push({ title: 'A' })
    const b = useToastQueue.getState().push({ title: 'B' })
    useToastQueue.getState().dismiss(a)
    const { toasts } = useToastQueue.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]?.id).toBe(b)
  })

  it('dismissAll() empties the queue', () => {
    useToastQueue.getState().push({ title: 'A' })
    useToastQueue.getState().push({ title: 'B' })
    useToastQueue.getState().dismissAll()
    expect(useToastQueue.getState().toasts).toEqual([])
  })

  it('push() generates unique ids across calls', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 8; i++) {
      ids.add(useToastQueue.getState().push({ title: `t${i}` }))
    }
    expect(ids.size).toBe(8)
  })
})
