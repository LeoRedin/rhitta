// =============================================================================
// transport.ts — SSE transport for React Native.
// =============================================================================
//
// React Native has no native EventSource, so we use fetch + ReadableStream
// to consume SSE text/event-stream responses. When a native EventSource
// polyfill becomes viable (e.g. react-native-event-source) this module is
// the only place that needs to change — the public hook API stays the same.
//
// Per ADR-0021: raw transport construction is banned outside this file.
// =============================================================================

type SSECallback<T> = (event: T) => void
type StatusCallback = (status: 'connecting' | 'open' | 'closed') => void

// Helpers for Hermes-native web APIs that are absent from RN type defs.
// Each casts through `unknown` to bypass the missing type — the runtime
// guard and the `AbortSignal.any` / `TextDecoder` checks below ensure we
// only call them when the platform supports them.
const g = globalThis as any
const gAbortSignal = AbortSignal as any
const gTextDecoder = g.TextDecoder as
  | (new (
      label?: string,
      options?: { fatal?: boolean; ignoreBOM?: boolean }
    ) => {
      decode(input?: Uint8Array | null, options?: { stream?: boolean }): string
    })
  | undefined

export function createSSEConnection<T>(
  url: string,
  eventType: string,
  callback: SSECallback<T>,
  onStatusChange: StatusCallback,
  signal: AbortSignal
): void {
  onStatusChange('connecting')

  const controller = new AbortController()

  // AbortSignal.any is available in Hermes >=0.15 but absent from RN types.
  const combinedSignal =
    typeof gAbortSignal.any === 'function' ? gAbortSignal.any([signal, controller.signal]) : signal

  signal.addEventListener('abort', () => controller.abort())

  fetch(url, {
    signal: combinedSignal,
    headers: { Accept: 'text/event-stream' },
  })
    .then(async (response) => {
      if (!response.ok) {
        onStatusChange('closed')
        return
      }

      // ReadableStream on response.body — Hermes >=0.13 (absent from RN types).
      const body: any = (response as unknown as { body: any | null }).body
      if (!body) {
        onStatusChange('closed')
        return
      }

      onStatusChange('open')
      const reader: any = body.getReader()

      // TextDecoder — Hermes >=0.12.
      if (!gTextDecoder) {
        onStatusChange('closed')
        return
      }
      const decoder = new gTextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value }: { done: boolean; value: any } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          let eventName = ''
          let data = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              data = line.slice(6)
            } else if (line === '' && data) {
              if (eventName === eventType || !eventName) {
                try {
                  callback(JSON.parse(data) as T)
                } catch {
                  /* skip malformed JSON payloads */
                }
              }
              eventName = ''
              data = ''
            }
          }
        }
      } catch {
        /* stream ended or was aborted */
      }
      onStatusChange('closed')
    })
    .catch(() => {
      if (!signal.aborted) onStatusChange('closed')
    })
}
