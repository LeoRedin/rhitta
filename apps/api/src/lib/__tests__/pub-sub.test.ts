import { describe, expect, test } from 'vitest'
import { InMemoryEventPublisher, type NoteCreatedEvent } from '../pub-sub.js'

describe('InMemoryEventPublisher', () => {
  test('records each published event with topic + payload', async () => {
    const publisher = new InMemoryEventPublisher()
    const event: NoteCreatedEvent = {
      noteId: 'note-1',
      authorId: 'user-1',
      occurredAt: new Date('2026-01-01T00:00:00Z'),
    }

    await publisher.publish('note-created', event)

    expect(publisher.published).toEqual([{ topic: 'note-created', event }])
  })

  test('preserves order across multiple publishes', async () => {
    const publisher = new InMemoryEventPublisher()
    await publisher.publish('note-created', { id: 1 })
    await publisher.publish('other-topic', { id: 2 })
    await publisher.publish('note-created', { id: 3 })

    expect(publisher.published).toHaveLength(3)
    expect(publisher.published[0]).toEqual({ topic: 'note-created', event: { id: 1 } })
    expect(publisher.published[1]).toEqual({ topic: 'other-topic', event: { id: 2 } })
    expect(publisher.published[2]).toEqual({ topic: 'note-created', event: { id: 3 } })
  })

  test('starts with empty published list', () => {
    const publisher = new InMemoryEventPublisher()
    expect(publisher.published).toEqual([])
  })
})
