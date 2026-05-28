# ADR 0018: Domain errors with a central HTTP mapper

## Status
Accepted

## Context
APIs go wrong in predictable categories: not found, validation failure, conflict, unauthenticated, forbidden, rate-limited, dependent service down. Each category maps to a specific HTTP status (404, 400, 409, 401, 403, 429, 502/503).

The naive shape is `try/catch` inside every handler with `return ctx.status(404)` or `throw new APIError(...)` calls. This pattern fails because:

1. Status codes get inconsistent across handlers — one endpoint returns 422 for validation, another returns 400.
2. New error types require touching every handler that might raise them.
3. The actual *business* code (the use-case) ends up reasoning about HTTP, polluting the application layer.
4. AGENTS.md rule 6 ("Errors thrown as typed domain errors, mapped centrally") becomes lip service.

Alternatives:

- **Per-handler mapping.** Status code logic in every endpoint. Status spaghetti.
- **Throw HTTP errors from use-cases.** Couples application layer to HTTP. Breaks hexagonal isolation (ADR-0002).
- **Single base error + status code property.** Better, but still mixes concerns inside the domain layer (the use-case shouldn't know about HTTP).
- **Domain error hierarchy + central mapper.** Use-cases throw `DomainError` subclasses (no HTTP knowledge). One file owns the translation. *(chosen)*

## Decision
Define a `DomainError` base class in `apps/api/src/modules/<feature>/domain/errors.ts` (or in a shared `lib/errors.ts` for cross-module errors). Subclasses are taxonomic, not feature-specific:

- `NotFoundError(entity: string, id: string)`
- `ValidationError(message: string, issues?: ZodIssue[])`
- `ConflictError(message: string)`
- `UnauthorizedError(message?: string)`
- `ForbiddenError(message: string)`
- `RateLimitedError(retryAfterSeconds?: number)`
- `DependencyFailureError(service: string, cause?: unknown)`

Each subclass extends `DomainError`, which extends `Error`. Each carries the structured context needed to render a useful HTTP response (`retryAfterSeconds` → `Retry-After` header; `issues` → response body).

The central mapper lives in `apps/api/src/lib/error-mapper.ts`. Signature:

```typescript
import { APIError, ErrCode } from 'encore.dev/api'
import { ZodError } from 'zod'
import { DomainError, NotFoundError, ValidationError, /* ... */ } from './errors'

export function mapError(err: unknown): APIError {
  if (err instanceof NotFoundError)        return new APIError(ErrCode.NotFound,        err.message)
  if (err instanceof ValidationError)      return new APIError(ErrCode.InvalidArgument, err.message)
  if (err instanceof ConflictError)        return new APIError(ErrCode.AlreadyExists,   err.message)
  if (err instanceof UnauthorizedError)    return new APIError(ErrCode.Unauthenticated, err.message)
  if (err instanceof ForbiddenError)       return new APIError(ErrCode.PermissionDenied, err.message)
  if (err instanceof RateLimitedError)     return new APIError(ErrCode.ResourceExhausted, err.message)
  if (err instanceof DependencyFailureError) return new APIError(ErrCode.Unavailable,   err.message)
  if (err instanceof ZodError)             return new APIError(ErrCode.InvalidArgument, 'request validation failed')
  // unknown error — preserve message in dev, hide in prod
  return new APIError(ErrCode.Internal, 'internal error')
}
```

Every HTTP handler ends with:

```typescript
try {
  // ... use-case + Zod parse (per ADR-0017)
} catch (e) {
  throw mapError(e)
}
```

Use-cases throw `DomainError` subclasses freely. They never reference `APIError` or HTTP status codes.

## Consequences
- **One file owns status mapping.** Changing how `ConflictError` renders (e.g., adding a header) is a one-file diff.
- **Use-cases stay framework-agnostic.** They can be unit-tested with in-memory adapters and no HTTP context.
- **Adding a new error type** is mechanical: add the class, add a branch in `mapError`. The compiler does not currently force exhaustiveness (`unknown` is the input type), so a discipline reminder: when adding a new `DomainError` subclass, update `mapError` in the same commit. A future Phase 3 structure-validator check can enforce this.
- **Cost: the `try/catch + mapError(e)` boilerplate at every handler.** Same as the Zod parse boilerplate in ADR-0017 — repetitive but uniform, generator-friendly.
- **Cost: a class hierarchy.** Modest. Each class is ~5 lines. The taxonomy is small and stable.
- **Zod errors are caught by the same mapper.** A failed `Schema.parse(req)` becomes a 400 with a consistent body shape, without per-handler boilerplate.
