import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import { describe, expect, test } from 'vitest'
import { ConflictError, ValidationError } from '../../../lib/errors.js'
import { Note } from '../domain/note.js'

function makeAuthor(): UserId {
  return randomUUID() as UserId
}

describe('Note.create', () => {
  test('builds a note with generated id, timestamps, and null deletedAt', () => {
    const authorId = makeAuthor()
    const before = Date.now()
    const note = Note.create({ authorId, title: 'Hello', body: 'world' })
    const after = Date.now()

    expect(note.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(note.authorId).toBe(authorId)
    expect(note.title).toBe('Hello')
    expect(note.body).toBe('world')
    expect(note.createdAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(note.createdAt.getTime()).toBeLessThanOrEqual(after)
    expect(note.updatedAt.getTime()).toBe(note.createdAt.getTime())
    expect(note.deletedAt).toBeNull()
    expect(note.isDeleted).toBe(false)
  })

  test('allows empty body (BODY_MIN = 0)', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'x', body: '' })
    expect(note.body).toBe('')
  })

  test('allows title at min length (1 char)', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'a', body: '' })
    expect(note.title).toBe('a')
  })

  test('allows title at max length (280 chars)', () => {
    const title = 'a'.repeat(280)
    const note = Note.create({ authorId: makeAuthor(), title, body: '' })
    expect(note.title.length).toBe(280)
  })

  test('allows body at max length (10_000 chars)', () => {
    const body = 'b'.repeat(10_000)
    const note = Note.create({ authorId: makeAuthor(), title: 'x', body })
    expect(note.body.length).toBe(10_000)
  })

  test('throws ValidationError on empty title', () => {
    expect(() => Note.create({ authorId: makeAuthor(), title: '', body: '' })).toThrow(
      ValidationError
    )
  })

  test('throws ValidationError on title longer than 280 chars', () => {
    const title = 'a'.repeat(281)
    expect(() => Note.create({ authorId: makeAuthor(), title, body: '' })).toThrow(ValidationError)
  })

  test('throws ValidationError on body longer than 10_000 chars', () => {
    const body = 'b'.repeat(10_001)
    expect(() => Note.create({ authorId: makeAuthor(), title: 'x', body })).toThrow(ValidationError)
  })

  test('generates a unique id per call', () => {
    const a = Note.create({ authorId: makeAuthor(), title: 'a', body: '' })
    const b = Note.create({ authorId: makeAuthor(), title: 'b', body: '' })
    expect(a.id).not.toBe(b.id)
  })
})

describe('Note.update', () => {
  test('updates title and body and bumps updatedAt', async () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'old', body: 'old body' })
    const originalUpdatedAt = note.updatedAt.getTime()
    // Small delay so the new Date() is strictly later.
    await new Promise((r) => setTimeout(r, 2))

    note.update({ title: 'new', body: 'new body' })

    expect(note.title).toBe('new')
    expect(note.body).toBe('new body')
    expect(note.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt)
    // createdAt is immutable.
    expect(note.createdAt.getTime()).toBeLessThanOrEqual(originalUpdatedAt)
  })

  test('updates only title when body is omitted', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'old', body: 'body' })
    note.update({ title: 'new' })
    expect(note.title).toBe('new')
    expect(note.body).toBe('body')
  })

  test('updates only body when title is omitted', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'title', body: 'old' })
    note.update({ body: 'new' })
    expect(note.title).toBe('title')
    expect(note.body).toBe('new')
  })

  test('still bumps updatedAt when no changes are provided', async () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'x', body: 'y' })
    const original = note.updatedAt.getTime()
    await new Promise((r) => setTimeout(r, 2))
    note.update({})
    expect(note.updatedAt.getTime()).toBeGreaterThan(original)
  })

  test('throws ValidationError on invalid title (empty)', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'old', body: '' })
    expect(() => note.update({ title: '' })).toThrow(ValidationError)
  })

  test('throws ValidationError on invalid body (too long)', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 't', body: '' })
    expect(() => note.update({ body: 'b'.repeat(10_001) })).toThrow(ValidationError)
  })

  test('leaves state untouched when validation fails', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'old', body: 'old' })
    expect(() => note.update({ title: '', body: 'new' })).toThrow(ValidationError)
    expect(note.title).toBe('old')
    expect(note.body).toBe('old')
  })
})

describe('Note.softDelete', () => {
  test('sets deletedAt and bumps updatedAt to the same instant', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'x', body: '' })
    expect(note.isDeleted).toBe(false)
    note.softDelete()
    expect(note.isDeleted).toBe(true)
    expect(note.deletedAt).toBeInstanceOf(Date)
    expect(note.updatedAt.getTime()).toBe(note.deletedAt?.getTime())
  })

  test('throws ConflictError when called twice', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'x', body: '' })
    note.softDelete()
    expect(() => note.softDelete()).toThrow(ConflictError)
    expect(() => note.softDelete()).toThrow(/already deleted/)
  })
})

describe('Note.toDTO', () => {
  test('returns a plain object matching the wire shape', () => {
    const authorId = makeAuthor()
    const note = Note.create({ authorId, title: 'hi', body: 'there' })
    const dto = note.toDTO()

    expect(dto).toEqual({
      id: note.id,
      authorId,
      title: 'hi',
      body: 'there',
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      deletedAt: null,
    })
  })

  test('reflects deletedAt after soft-delete', () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'x', body: '' })
    note.softDelete()
    const dto = note.toDTO()
    expect(dto.deletedAt).toBeInstanceOf(Date)
  })
})
