import { describe, expect, test } from 'vitest'
import { InMemoryEmailAdapter } from '../in-memory-email-adapter.js'

describe('InMemoryEmailAdapter', () => {
  test('starts with an empty sent list', () => {
    const adapter = new InMemoryEmailAdapter()
    expect(adapter.sent).toEqual([])
  })

  test('records each send with the returned id and original message', async () => {
    const adapter = new InMemoryEmailAdapter()
    const message = {
      to: 'alice@example.com',
      from: 'no-reply@rhitta.dev',
      subject: 'hello',
      text: 'world',
    }

    const result = await adapter.send(message)

    expect(typeof result.id).toBe('string')
    expect(result.id.length).toBeGreaterThan(0)
    expect(adapter.sent).toEqual([{ id: result.id, message }])
  })

  test('generates unique ids across sends', async () => {
    const adapter = new InMemoryEmailAdapter()
    const message = {
      to: 'a@example.com',
      from: 'b@example.com',
      subject: 's',
      text: 't',
    }

    const a = await adapter.send(message)
    const b = await adapter.send(message)

    expect(a.id).not.toBe(b.id)
    expect(adapter.sent).toHaveLength(2)
  })

  test('preserves order across multiple sends', async () => {
    const adapter = new InMemoryEmailAdapter()
    await adapter.send({ to: '1@x', from: 'f', subject: 'one', text: 't' })
    await adapter.send({ to: '2@x', from: 'f', subject: 'two', text: 't' })
    await adapter.send({ to: '3@x', from: 'f', subject: 'three', text: 't' })

    expect(adapter.sent.map((entry) => entry.message.subject)).toEqual(['one', 'two', 'three'])
  })

  test('supports multi-recipient `to` and optional html / replyTo', async () => {
    const adapter = new InMemoryEmailAdapter()
    const message = {
      to: ['a@x', 'b@x'],
      from: 'f@x',
      subject: 'broadcast',
      html: '<p>hi</p>',
      replyTo: 'reply@x',
    }

    await adapter.send(message)

    expect(adapter.sent[0]?.message).toEqual(message)
  })

  test('clear() empties the captured sends', async () => {
    const adapter = new InMemoryEmailAdapter()
    await adapter.send({ to: 'x', from: 'f', subject: 's', text: 't' })
    expect(adapter.sent).toHaveLength(1)

    adapter.clear()

    expect(adapter.sent).toEqual([])
  })
})
