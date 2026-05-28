// =============================================================================
// transport.ts — Hidden SSE transport implementation.
// =============================================================================
//
// Per ADR-0021: raw `EventSource` construction is banned outside this file
// by `@rhitta/biome-config/web-app`'s `noRestrictedImports` (statically
// un-enforceable for global constructors — enforced via code review).
// Swap to Encore streaming when available — the public hook API remains
// unchanged.
// =============================================================================

type SSECallback<T> = (event: T) => void

export function createSSEConnection<T>(
  url: string,
  eventType: string,
  callback: SSECallback<T>,
  onStatusChange: (status: 'connecting' | 'open' | 'closed') => void,
  signal: AbortSignal
): void {
  onStatusChange('connecting')

  const source = new EventSource(url)

  source.addEventListener(eventType, (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as T
      callback(data)
    } catch {
      // Ignore malformed events
    }
  })

  source.addEventListener('open', () => {
    onStatusChange('open')
  })

  source.addEventListener('error', () => {
    source.close()
    onStatusChange('closed')
  })

  signal.addEventListener('abort', () => {
    source.close()
    onStatusChange('closed')
  })
}
