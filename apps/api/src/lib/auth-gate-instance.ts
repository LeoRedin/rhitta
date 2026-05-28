/**
 * Lazily-initialised process singleton for the production {@link AuthGate}.
 *
 * The HTTP handler layer (Task 7) cannot get deps from a factory call at
 * module load — Encore declares routes at import time. So handlers reach
 * for the gate via this accessor instead. `composeRoot()` (Task 10)
 * publishes the real `BetterAuthGate` here via {@link setAuthGate} (the
 * same hook tests use).
 *
 * Until `composeRoot()` runs we fall back to {@link StubAuthGate}, which
 * throws `UnauthorizedError` on every call — safe by default, because a
 * wired-up production deploy will swap it out before serving traffic.
 *
 * NOTE: every HTTP integration test in this package MUST call
 * `setAuthGate(...)` in its `beforeEach` and reset it to `null` in
 * `afterEach` to avoid bleed between tests.
 */
import { type AuthGate, StubAuthGate } from './auth-gate.js'

let _instance: AuthGate | null = null

export function authGate(): AuthGate {
  if (_instance === null) {
    _instance = new StubAuthGate()
  }
  return _instance
}

/**
 * Install (or clear, with `null`) the process-wide {@link AuthGate}.
 *
 * Used by both production wiring (`composeRoot()`) and test setup. The
 * historical name `__setAuthGateForTesting` is gone — the hook is no
 * longer test-only.
 */
export function setAuthGate(gate: AuthGate | null): void {
  _instance = gate
}
