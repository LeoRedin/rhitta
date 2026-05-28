/**
 * `GET /events/notes` — SSE streaming endpoint for note-created events.
 *
 * Authenticates the request via session cookie, subscribes to the in-process
 * event bus (`sseEventBus`), and streams matching events filtered by
 * `authorId === currentUserId` as Server-Sent Events.
 *
 * Uses `api.raw` because Encore 1.57.5 has no dedicated SSE primitive.
 * The raw handler writes SSE frames directly to the Node.js `ServerResponse`.
 *
 * Encore static-analyzer note: concrete `IncomingMessage` / `ServerResponse`
 * interfaces required by `api.raw`'s `RawHandler` type — the Encore static
 * analyzer won't resolve Zod-inferred or abstract stream types here. The
 * runtime parameters are actually Encore's `RawRequest` / `RawResponse` (see
 * `node_modules/encore.dev/api/node_http.ts`), but they satisfy the Node.js
 * `http` module interface structurally.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { sseEventBus } from '../../../lib/event-bus.js'
import { requestFromMeta } from './request-bridge.js'

/**
 * Payload shape emitted by the `create` endpoint on the event bus.
 * Must match the shape published in `create.ts`.
 */
interface NoteCreatedBusEvent {
  noteId: string
  authorId: string
  occurredAt: Date
}

export const stream = api.raw(
  { method: 'GET', path: '/events/notes', expose: true },
  async (req: IncomingMessage, resp: ServerResponse): Promise<void> => {
    try {
      // Resolve the authenticated user from session cookies.
      const gate = authGate()
      const user = await gate.getCurrentUser(requestFromMeta(currentRequest()))

      // Write SSE response headers before any data.
      resp.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })

      // Flush headers immediately so the client sees connection open.
      resp.flushHeaders()

      // Subscribe to the in-process event bus, filtering by authorId.
      const onEvent = (event: NoteCreatedBusEvent) => {
        if (event.authorId === user.userId) {
          resp.write(`event: note-created\ndata: ${JSON.stringify(event)}\n\n`)
        }
      }

      sseEventBus.on('note-created', onEvent)

      // Keepalive heartbeat every 30 seconds — proxies and load balancers
      // often drop idle connections.
      const keepAlive = setInterval(() => {
        resp.write(':keepalive\n\n')
      }, 30_000)

      // Clean up resources when the client disconnects.
      req.on('close', () => {
        sseEventBus.off('note-created', onEvent)
        clearInterval(keepAlive)
        resp.end()
      })
    } catch (_err) {
      // Auth failure (or any other setup error) — send 401 before any SSE
      // data. If headers were already sent by the time we get here, we can
      // no longer change the status, so just close the connection.
      if (!resp.headersSent) {
        const body = JSON.stringify({ error: 'Unauthorized' })
        resp.writeHead(401, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body).toString(),
        })
        resp.end(body)
      } else {
        resp.end()
      }
    }
  }
)
