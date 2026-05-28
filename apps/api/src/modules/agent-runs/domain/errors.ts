/**
 * Re-export shared errors for ergonomic use inside this module.
 *
 * The agent-runs module's hot error paths are `DependencyFailureError`
 * (Anthropic call failed) and `ValidationError` (request schema rejected
 * the payload). The single shared hierarchy lives in `lib/errors.ts`
 * (per ADR-0018); per-module subclasses would just give the error mapper
 * more cases to teach itself.
 */
export { DependencyFailureError, ValidationError } from '../../../lib/errors.js'
