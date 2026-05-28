/**
 * Real `AuthGate` backed by Better Auth.
 *
 * Reads the session from the Better Auth-issued cookie (or `Authorization`
 * header) on every protected request via `auth.api.getSession`. If no
 * valid session is present, throws `UnauthorizedError`, which the
 * central `mapError` translates into a 401.
 *
 * Constructor takes the auth instance as a dependency so tests can hand
 * in a fake without spinning up a real Better Auth + Postgres stack.
 * `BetterAuthGate.production()` returns one wired to the live
 * `better-auth-adapter` export — that's the factory `composeRoot` uses.
 */
import type { UserId } from '@rhitta/contracts/auth'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { UnauthorizedError } from '../../../lib/errors.js'
import { auth as productionAuth } from './better-auth-adapter.js'

/**
 * Narrow view of the Better Auth instance — just the bits the gate
 * needs. Better Auth's full `Auth` type is rife with conditional plugin
 * types; depending on that surface area would couple us to its exact
 * plugin lineup. The shape below is the stable contract.
 */
export type AuthInstance = {
  api: {
    getSession: (input: { headers: Headers }) => Promise<{
      session: { userId: string } | null
      user: { id: string; email: string } | null
    } | null>
  }
}

export class BetterAuthGate implements AuthGate {
  constructor(private readonly auth: AuthInstance) {}

  /**
   * Convenience factory wiring the production Better Auth instance.
   * `composeRoot()` calls this.
   */
  static production(): BetterAuthGate {
    return new BetterAuthGate(productionAuth as unknown as AuthInstance)
  }

  async getCurrentUser(req: Request): Promise<{ userId: UserId; email: string }> {
    const result = await this.auth.api.getSession({ headers: req.headers })
    if (!result || !result.user) {
      throw new UnauthorizedError('Not authenticated')
    }
    return {
      userId: result.user.id as UserId,
      email: result.user.email,
    }
  }
}
