/**
 * In-process event bus for realtime streaming.
 *
 * SSE streaming endpoints subscribe to this bus to receive domain events
 * as they happen. The bus is a plain Node.js `EventEmitter` — no external
 * infrastructure needed.
 *
 * To wire a new event source:
 *   1. Publish: `sseEventBus.emit('note-created', payload)`
 *   2. Subscribe: `sseEventBus.on('note-created', handler)`
 *
 * The alternative — subscribing directly to Encore's Pub/Sub topics from
 * within a per-request context — is not supported by Encore's subscription
 * model, which is declarative and lifecycle-bound rather than per-request.
 * This bus fills that gap: producers fire events here and on Encore topics;
 * SSE consumers only listen here.
 */
import { EventEmitter } from 'node:events'

export const sseEventBus = new EventEmitter()

// Streaming endpoints may have many concurrent connections; raise the
// default (10) listener warning threshold accordingly.
sseEventBus.setMaxListeners(100)
