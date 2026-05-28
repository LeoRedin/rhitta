// =============================================================================
// use-realtime-subscription.ts — Centralized realtime hook factory
// =============================================================================
//
// Single public hook per ADR-0021. All components go through this; raw
// `new EventSource(...)` is banned outside `transport.ts`. Transport
// implementation is hidden behind this interface and dynamically imported to
// keep it swappable (SSE today, Encore streaming or WebSocket tomorrow).
// =============================================================================

import type { NoteCreatedEvent } from '@rhitta/contracts/events'
import { useEffect, useState } from 'react'

type TopicEventMap = {
  'note-created': NoteCreatedEvent
}

type RealtimeStatus = 'connecting' | 'open' | 'closed'

export function useRealtimeSubscription<T extends keyof TopicEventMap>(
  topic: T,
  callback: (event: TopicEventMap[T]) => void,
  deps: ReadonlyArray<unknown>
): { status: RealtimeStatus; error: Error | null } {
  const [status, setStatus] = useState<RealtimeStatus>('closed')
  const [error, setError] = useState<Error | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: callback intentionally omitted (stable ref), topic and deps forwarded from consumer
  useEffect(() => {
    const controller = new AbortController()

    // Dynamic import keeps the transport swappable without touching the
    // public hook API or its consumers.
    import('./transport.js')
      .then(({ createSSEConnection }) => {
        const env = (
          import.meta as ImportMeta & {
            env?: Record<string, string | undefined>
          }
        ).env
        const apiBase = env?.VITE_API_URL ?? 'http://localhost:4000'

        createSSEConnection<NoteCreatedEvent>(
          `${apiBase}/events/notes`,
          'note-created',
          callback as (event: NoteCreatedEvent) => void,
          (newStatus: RealtimeStatus) => setStatus(newStatus),
          controller.signal
        )
      })
      .catch((err: Error) => {
        setError(err)
      })

    return () => controller.abort()
  }, [topic, ...deps])

  return { status, error }
}
