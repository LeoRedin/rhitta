import { describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../../../lib/errors.js'
import { type AuthInstance, BetterAuthGate } from '../infra/better-auth-gate.js'

/**
 * Hand-rolled fake of the narrow `AuthInstance` surface the gate
 * depends on. We mock at this seam — not at Better Auth's full API —
 * so the test stays sealed from upstream library churn.
 */
function fakeAuth(result: Awaited<ReturnType<AuthInstance['api']['getSession']>>): AuthInstance {
  return {
    api: {
      getSession: vi.fn().mockResolvedValue(result),
    },
  }
}

function reqWithHeaders(): Request {
  return new Request('http://localhost/whatever', {
    headers: { cookie: 'better-auth.session_token=fake-token' },
  })
}

describe('BetterAuthGate', () => {
  test('returns user info when Better Auth resolves a session', async () => {
    const auth = fakeAuth({
      session: { userId: 'user-1' },
      user: { id: 'user-1', email: 'alice@example.com' },
    })
    const gate = new BetterAuthGate(auth)

    const out = await gate.getCurrentUser(reqWithHeaders())

    expect(out).toEqual({ userId: 'user-1', email: 'alice@example.com' })
    expect(auth.api.getSession).toHaveBeenCalledTimes(1)
  })

  test('throws UnauthorizedError when Better Auth returns null', async () => {
    const gate = new BetterAuthGate(fakeAuth(null))

    await expect(gate.getCurrentUser(reqWithHeaders())).rejects.toBeInstanceOf(UnauthorizedError)
  })

  test('throws UnauthorizedError when result has no user (session-less)', async () => {
    const gate = new BetterAuthGate(fakeAuth({ session: null, user: null }))

    await expect(gate.getCurrentUser(reqWithHeaders())).rejects.toBeInstanceOf(UnauthorizedError)
  })

  test('forwards the request headers to Better Auth verbatim', async () => {
    const auth = fakeAuth({
      session: { userId: 'user-2' },
      user: { id: 'user-2', email: 'bob@example.com' },
    })
    const gate = new BetterAuthGate(auth)
    const req = reqWithHeaders()

    await gate.getCurrentUser(req)

    const mock = auth.api.getSession as ReturnType<typeof vi.fn>
    expect(mock).toHaveBeenCalledWith({ headers: req.headers })
  })
})
