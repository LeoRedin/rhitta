import { createHash } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import { InMemoryStorageAdapter } from '../in-memory-storage-adapter.js'

const HEX_32 = /^[a-f0-9]{32}$/

describe('InMemoryStorageAdapter', () => {
  test('putObject stores the bytes and returns an md5 etag', async () => {
    const adapter = new InMemoryStorageAdapter()
    const body = Buffer.from('hello world')

    const { etag } = await adapter.putObject({ key: 'a.txt', body })

    expect(etag).toMatch(HEX_32)
    expect(etag).toBe(createHash('md5').update(body).digest('hex'))
  })

  test('getObject returns body + content-type + metadata for a stored key', async () => {
    const adapter = new InMemoryStorageAdapter()
    await adapter.putObject({
      key: 'photo.png',
      body: Buffer.from([1, 2, 3]),
      contentType: 'image/png',
      metadata: { owner: 'alice' },
    })

    const got = await adapter.getObject('photo.png')

    expect(got).not.toBeNull()
    expect(got?.body).toEqual(Buffer.from([1, 2, 3]))
    expect(got?.contentType).toBe('image/png')
    expect(got?.metadata).toEqual({ owner: 'alice' })
  })

  test('getObject defaults contentType to null and metadata to {} when not set', async () => {
    const adapter = new InMemoryStorageAdapter()
    await adapter.putObject({ key: 'bare', body: Buffer.from('x') })

    const got = await adapter.getObject('bare')

    expect(got?.contentType).toBeNull()
    expect(got?.metadata).toEqual({})
  })

  test('getObject returns null for an unknown key', async () => {
    const adapter = new InMemoryStorageAdapter()
    expect(await adapter.getObject('missing')).toBeNull()
  })

  test('putObject is idempotent on key — second write overwrites the first', async () => {
    const adapter = new InMemoryStorageAdapter()
    await adapter.putObject({ key: 'k', body: Buffer.from('v1') })
    await adapter.putObject({ key: 'k', body: Buffer.from('v2'), contentType: 'text/plain' })

    const got = await adapter.getObject('k')
    expect(got?.body).toEqual(Buffer.from('v2'))
    expect(got?.contentType).toBe('text/plain')

    const list = await adapter.listObjects()
    expect(list).toHaveLength(1)
    expect(list[0]?.key).toBe('k')
  })

  test('putObject accepts a Uint8Array body', async () => {
    const adapter = new InMemoryStorageAdapter()
    const bytes = new Uint8Array([10, 20, 30])

    await adapter.putObject({ key: 'u', body: bytes })

    const got = await adapter.getObject('u')
    expect(got?.body).toEqual(Buffer.from(bytes))
  })

  test('deleteObject removes the key (no-op when absent)', async () => {
    const adapter = new InMemoryStorageAdapter()
    await adapter.putObject({ key: 'k', body: Buffer.from('x') })

    await adapter.deleteObject('k')
    expect(await adapter.getObject('k')).toBeNull()

    // Removing a missing key should not throw.
    await expect(adapter.deleteObject('missing')).resolves.toBeUndefined()
  })

  test('listObjects returns everything when no prefix is given', async () => {
    const adapter = new InMemoryStorageAdapter()
    await adapter.putObject({ key: 'a/1', body: Buffer.from('one') })
    await adapter.putObject({ key: 'b/2', body: Buffer.from('twotwo') })

    const list = await adapter.listObjects()

    expect(list).toHaveLength(2)
    const byKey = Object.fromEntries(list.map((entry) => [entry.key, entry]))
    expect(byKey['a/1']?.size).toBe(3)
    expect(byKey['b/2']?.size).toBe(6)
    expect(byKey['a/1']?.etag).toMatch(HEX_32)
    expect(byKey['a/1']?.lastModified).toBeInstanceOf(Date)
  })

  test('listObjects filters by prefix', async () => {
    const adapter = new InMemoryStorageAdapter()
    await adapter.putObject({ key: 'users/1.json', body: Buffer.from('a') })
    await adapter.putObject({ key: 'users/2.json', body: Buffer.from('b') })
    await adapter.putObject({ key: 'notes/3.json', body: Buffer.from('c') })

    const users = await adapter.listObjects('users/')

    expect(users.map((entry) => entry.key).sort()).toEqual(['users/1.json', 'users/2.json'])
  })

  test('presignGet returns a memory:// URL and records the key for introspection', async () => {
    const adapter = new InMemoryStorageAdapter()

    const url = await adapter.presignGet('k', 60)

    expect(url).toMatch(/^memory:\/\/presigned\/[0-9a-f-]{36}$/)
    const token = url.replace('memory://presigned/', '')
    expect(adapter.presignedTokens.get(token)).toBe('k')
  })

  test('presignGet issues a fresh token per call', async () => {
    const adapter = new InMemoryStorageAdapter()

    const a = await adapter.presignGet('same-key', 60)
    const b = await adapter.presignGet('same-key', 60)

    expect(a).not.toBe(b)
    expect(adapter.presignedTokens.size).toBe(2)
  })

  test('clear() resets both objects and presigned tokens', async () => {
    const adapter = new InMemoryStorageAdapter()
    await adapter.putObject({ key: 'k', body: Buffer.from('x') })
    await adapter.presignGet('k', 60)

    adapter.clear()

    expect(await adapter.listObjects()).toEqual([])
    expect(adapter.presignedTokens.size).toBe(0)
  })
})
