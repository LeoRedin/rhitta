import { describe, expect, test } from 'vitest'
import {
  ConflictError,
  DependencyFailureError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
  UnauthorizedError,
  ValidationError,
} from '../errors.js'

describe('DomainError', () => {
  test('extends Error and carries the constructor name', () => {
    const err = new DomainError('boom')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(DomainError)
    expect(err.message).toBe('boom')
    expect(err.name).toBe('DomainError')
  })
})

describe('NotFoundError', () => {
  test('formats entity + id into the message and exposes both fields', () => {
    const err = new NotFoundError('Note', 'note-123')
    expect(err).toBeInstanceOf(DomainError)
    expect(err.entity).toBe('Note')
    expect(err.id).toBe('note-123')
    expect(err.message).toBe('Note not found: note-123')
    expect(err.name).toBe('NotFoundError')
  })
})

describe('ValidationError', () => {
  test('carries message and optional issues', () => {
    const issues = [{ path: ['title'], message: 'required' }]
    const err = new ValidationError('invalid input', issues)
    expect(err).toBeInstanceOf(DomainError)
    expect(err.message).toBe('invalid input')
    expect(err.issues).toBe(issues)
    expect(err.name).toBe('ValidationError')
  })

  test('issues is optional', () => {
    const err = new ValidationError('invalid')
    expect(err.issues).toBeUndefined()
  })
})

describe('ConflictError', () => {
  test('extends DomainError with default name', () => {
    const err = new ConflictError('duplicate')
    expect(err).toBeInstanceOf(DomainError)
    expect(err.message).toBe('duplicate')
    expect(err.name).toBe('ConflictError')
  })
})

describe('UnauthorizedError', () => {
  test('extends DomainError', () => {
    const err = new UnauthorizedError('no session')
    expect(err).toBeInstanceOf(DomainError)
    expect(err.message).toBe('no session')
    expect(err.name).toBe('UnauthorizedError')
  })
})

describe('ForbiddenError', () => {
  test('extends DomainError', () => {
    const err = new ForbiddenError('not your note')
    expect(err).toBeInstanceOf(DomainError)
    expect(err.message).toBe('not your note')
    expect(err.name).toBe('ForbiddenError')
  })
})

describe('RateLimitedError', () => {
  test('carries message and optional retryAfterSeconds', () => {
    const err = new RateLimitedError('slow down', 30)
    expect(err).toBeInstanceOf(DomainError)
    expect(err.message).toBe('slow down')
    expect(err.retryAfterSeconds).toBe(30)
    expect(err.name).toBe('RateLimitedError')
  })

  test('retryAfterSeconds is optional', () => {
    const err = new RateLimitedError('slow down')
    expect(err.retryAfterSeconds).toBeUndefined()
  })
})

describe('DependencyFailureError', () => {
  test('formats service + message and preserves cause', () => {
    const cause = new Error('socket hang up')
    const err = new DependencyFailureError('resend', 'timeout', cause)
    expect(err).toBeInstanceOf(DomainError)
    expect(err.service).toBe('resend')
    expect(err.message).toBe('resend: timeout')
    expect(err.cause).toBe(cause)
    expect(err.name).toBe('DependencyFailureError')
  })

  test('cause is optional', () => {
    const err = new DependencyFailureError('resend', 'timeout')
    expect(err.cause).toBeUndefined()
  })
})
