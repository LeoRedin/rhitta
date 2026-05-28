/**
 * Domain error hierarchy (per ADR-0018).
 *
 * Use-cases throw these from the application/domain layers. The central
 * mapper in `error-mapper.ts` translates them into framework-level HTTP
 * errors at the edge so the domain stays HTTP-agnostic.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends DomainError {
  constructor(
    public readonly entity: string,
    public readonly id: string
  ) {
    super(`${entity} not found: ${id}`)
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly issues?: unknown[]
  ) {
    super(message)
  }
}

export class ConflictError extends DomainError {}

export class UnauthorizedError extends DomainError {}

export class ForbiddenError extends DomainError {}

export class RateLimitedError extends DomainError {
  constructor(
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message)
  }
}

export class DependencyFailureError extends DomainError {
  constructor(
    public readonly service: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`${service}: ${message}`)
  }
}
