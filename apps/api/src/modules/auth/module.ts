/**
 * Auth module composition root (per ADR-0003).
 *
 * Returns the auth-related ports the rest of the API depends on. For
 * the auth module this is just `authGate`; the actual auth endpoints
 * (sign-in, sign-up, magic-link, etc.) are mounted by re-exporting
 * `authHandler` — Encore picks it up via static analysis of the
 * service's module graph.
 *
 * The Better Auth singleton itself is constructed inside the
 * infrastructure layer (`infra/better-auth-adapter.ts`); we just lift
 * a typed gate over it.
 */
import type { AuthGate } from '../../lib/auth-gate.js'
import { BetterAuthGate } from './infra/better-auth-gate.js'

export { authHandler } from './http/auth-handler.js'

export function registerAuthModule(): { authGate: AuthGate } {
  return { authGate: BetterAuthGate.production() }
}
