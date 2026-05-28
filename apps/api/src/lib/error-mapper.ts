import { APIError } from 'encore.dev/api'
import { ZodError } from 'zod'
import {
  ConflictError,
  DependencyFailureError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
  UnauthorizedError,
  ValidationError,
} from './errors.js'

/**
 * Maps an unknown thrown value into a framework-level `APIError`
 * (per ADR-0018). Use at the edge of every HTTP handler:
 *
 * ```ts
 * try {
 *   return await useCase.execute(input)
 * } catch (e) {
 *   throw mapError(e)
 * }
 * ```
 *
 * Domain errors get a precise status; ZodError becomes invalidArgument;
 * everything else collapses to a generic internal error (the original
 * message is intentionally hidden so we don't leak stack-trace details).
 */
export function mapError(err: unknown): APIError {
  if (err instanceof NotFoundError) return APIError.notFound(err.message)
  if (err instanceof ValidationError) return APIError.invalidArgument(err.message)
  if (err instanceof ConflictError) return APIError.alreadyExists(err.message)
  if (err instanceof UnauthorizedError) return APIError.unauthenticated(err.message)
  if (err instanceof ForbiddenError) return APIError.permissionDenied(err.message)
  if (err instanceof RateLimitedError) return APIError.resourceExhausted(err.message)
  if (err instanceof DependencyFailureError) return APIError.unavailable(err.message)
  if (err instanceof ZodError) return APIError.invalidArgument('request validation failed')
  if (err instanceof DomainError) return APIError.internal(err.message)
  // Truly unknown — hide details from clients.
  return APIError.internal('internal error')
}
