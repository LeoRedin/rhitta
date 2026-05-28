/**
 * Re-export shared errors for ergonomic use inside this module.
 *
 * Note-specific errors don't need their own subclasses — the entity name
 * carried by `NotFoundError(entity, id)` is enough to discriminate. Keeping
 * a single shared hierarchy (per ADR-0018) avoids a proliferation of
 * per-module error classes that the error-mapper would have to teach itself.
 */
export {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../lib/errors.js'
