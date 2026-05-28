import type { UserId } from '@rhitta/contracts/auth'
import { UnauthorizedError } from './errors.js'

/**
 * Hexagonal port the rest of the API depends on to resolve the
 * currently-authenticated principal from a request.
 *
 * The real implementation lands in Task 4 (`modules/auth`) on top of
 * Better Auth. This file ships a typed stub so downstream tasks (Task 5
 * notes domain, etc.) can wire an `AuthGate` dependency without waiting
 * on the auth module.
 */
export interface AuthGate {
  getCurrentUser(req: Request): Promise<{ userId: UserId; email: string }>
}

/**
 * Placeholder `AuthGate` — always throws `UnauthorizedError`. Replaced
 * by Task 4 with a real Better Auth-backed session reader.
 */
export class StubAuthGate implements AuthGate {
  async getCurrentUser(_req: Request): Promise<{ userId: UserId; email: string }> {
    throw new UnauthorizedError('Auth gate not wired yet — Task 4 implements this')
  }
}
