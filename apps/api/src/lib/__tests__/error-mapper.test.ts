import { APIError, ErrCode } from 'encore.dev/api'
import { describe, expect, test } from 'vitest'
import { ZodError, z } from 'zod'
import { mapError } from '../error-mapper.js'
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

describe('mapError', () => {
  test('NotFoundError → notFound', () => {
    const out = mapError(new NotFoundError('Note', 'note-1'))
    expect(out).toBeInstanceOf(APIError)
    expect(out.code).toBe(ErrCode.NotFound)
    expect(out.message).toBe('Note not found: note-1')
  })

  test('ValidationError → invalidArgument', () => {
    const out = mapError(new ValidationError('bad input'))
    expect(out.code).toBe(ErrCode.InvalidArgument)
    expect(out.message).toBe('bad input')
  })

  test('ConflictError → alreadyExists', () => {
    const out = mapError(new ConflictError('duplicate'))
    expect(out.code).toBe(ErrCode.AlreadyExists)
    expect(out.message).toBe('duplicate')
  })

  test('UnauthorizedError → unauthenticated', () => {
    const out = mapError(new UnauthorizedError('no session'))
    expect(out.code).toBe(ErrCode.Unauthenticated)
    expect(out.message).toBe('no session')
  })

  test('ForbiddenError → permissionDenied', () => {
    const out = mapError(new ForbiddenError('nope'))
    expect(out.code).toBe(ErrCode.PermissionDenied)
    expect(out.message).toBe('nope')
  })

  test('RateLimitedError → resourceExhausted', () => {
    const out = mapError(new RateLimitedError('slow', 5))
    expect(out.code).toBe(ErrCode.ResourceExhausted)
    expect(out.message).toBe('slow')
  })

  test('DependencyFailureError → unavailable', () => {
    const out = mapError(new DependencyFailureError('resend', 'timeout'))
    expect(out.code).toBe(ErrCode.Unavailable)
    expect(out.message).toBe('resend: timeout')
  })

  test('ZodError → invalidArgument with generic message', () => {
    let zodErr: ZodError | undefined
    try {
      z.object({ x: z.string() }).parse({ x: 1 })
    } catch (e) {
      zodErr = e as ZodError
    }
    expect(zodErr).toBeInstanceOf(ZodError)
    const out = mapError(zodErr)
    expect(out.code).toBe(ErrCode.InvalidArgument)
    expect(out.message).toBe('request validation failed')
  })

  test('unrecognized DomainError subclass → internal with its message', () => {
    class CustomDomainError extends DomainError {}
    const out = mapError(new CustomDomainError('weird'))
    expect(out.code).toBe(ErrCode.Internal)
    expect(out.message).toBe('weird')
  })

  test('unknown thrown value → internal with generic message (no leak)', () => {
    const out = mapError(new Error('secret stack detail'))
    expect(out.code).toBe(ErrCode.Internal)
    expect(out.message).toBe('internal error')
  })

  test('non-Error throw → internal with generic message', () => {
    const out = mapError('string thrown')
    expect(out.code).toBe(ErrCode.Internal)
    expect(out.message).toBe('internal error')
  })
})
