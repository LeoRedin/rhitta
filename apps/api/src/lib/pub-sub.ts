import { Topic } from 'encore.dev/pubsub'

/**
 * Hexagonal port for publishing domain events. Use-cases depend on this
 * interface (not Encore's `Topic`) so they can be unit-tested with the
 * in-memory adapter below.
 *
 * NOTE: the string-keyed `topic` parameter is intentionally weak for v0.
 * A stronger typing would be a typed event registry mapping each event
 * shape to a topic name. Revisit if/when the number of events grows past
 * a handful.
 */
export interface EventPublisher {
  publish<T>(topic: string, event: T): Promise<void>
}

// ---- Typed Encore topics ---------------------------------------------------

/**
 * Payload for the `note-created` topic. Subscribers (e.g. an email
 * notifier) can fan out on this. Fields are domain-shaped — adapters at
 * the edge translate them into wire formats.
 */
export type NoteCreatedEvent = {
  noteId: string
  authorId: string
  occurredAt: Date
}

export const noteCreatedTopic = new Topic<NoteCreatedEvent>('note-created', {
  deliveryGuarantee: 'at-least-once',
})

// ---- Adapters --------------------------------------------------------------

/**
 * Encore-backed `EventPublisher`. Routes typed events to their typed
 * topics by name. Throws on unknown topics so a misrouted publish fails
 * loudly rather than silently dropping the message.
 */
export class EncoreEventPublisher implements EventPublisher {
  async publish<T>(topic: string, event: T): Promise<void> {
    if (topic === 'note-created') {
      await noteCreatedTopic.publish(event as NoteCreatedEvent)
      return
    }
    throw new Error(`Unknown topic: ${topic}`)
  }
}

/**
 * In-memory `EventPublisher` for unit tests. Stores every publish in
 * `published` so assertions can verify that a use-case emitted the right
 * event on the right topic.
 */
export class InMemoryEventPublisher implements EventPublisher {
  public readonly published: Array<{ topic: string; event: unknown }> = []

  async publish<T>(topic: string, event: T): Promise<void> {
    this.published.push({ topic, event })
  }
}
