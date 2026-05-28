/**
 * Thin domain value object wrapping a Better Auth session snapshot.
 *
 * Better Auth owns the authoritative session row (in `session` table)
 * and its lifecycle. This class exists so the rest of the codebase has
 * a typed handle on the relevant fields (instead of leaking Better
 * Auth's full session shape across module boundaries).
 *
 * It deliberately has no behaviour beyond a couple of derived getters
 * — anything stateful (extend, revoke, refresh) goes through Better
 * Auth's API.
 */
import type { Session, UserId } from '@rhitta/contracts/auth'

export class AuthSession {
  constructor(public readonly snapshot: Session) {}

  get userId(): UserId {
    return this.snapshot.userId
  }

  get isExpired(): boolean {
    return this.snapshot.expiresAt.getTime() <= Date.now()
  }
}
