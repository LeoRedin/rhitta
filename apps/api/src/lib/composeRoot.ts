import { registerAuthModule } from '../modules/auth/module.js'
import { type AuthGate, StubAuthGate } from './auth-gate.js'
import { EncoreEventPublisher, type EventPublisher, InMemoryEventPublisher } from './pub-sub.js'

/**
 * The wiring root for the API. Every cross-cutting dependency a
 * use-case might need is assembled here and passed down explicitly
 * (per ADR-0003 — module DI pattern). Use-cases never `import` adapters
 * directly; they receive ports as constructor arguments.
 */
export type AppDeps = {
  eventPublisher: EventPublisher
  authGate: AuthGate
  // Adapter wiring (email, storage, agent provider) lands in Tasks 8–10.
}

/**
 * Production root. Returns adapters that talk to real infrastructure.
 *
 * The `authGate` is now wired to Better Auth via `registerAuthModule()`
 * (Task 4). The auth module also re-exports `authHandler`, which Encore
 * picks up to serve `/auth/*` routes — that mount happens at module
 * import time, not here.
 */
export function composeRoot(): AppDeps {
  const auth = registerAuthModule()
  return {
    eventPublisher: new EncoreEventPublisher(),
    authGate: auth.authGate,
  }
}

/**
 * Test root. Returns in-memory adapters so use-case tests can run
 * without any external infrastructure. `overrides` lets a test swap in
 * a custom adapter (e.g. a hand-rolled spy `AuthGate`).
 *
 * Note: this intentionally keeps `StubAuthGate` rather than the real
 * Better Auth-backed gate — instantiating Better Auth would require a
 * live Postgres. Tests that need a real session should construct a
 * `BetterAuthGate` directly with a hand-rolled fake auth instance.
 */
export function composeTestRoot(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    eventPublisher: new InMemoryEventPublisher(),
    authGate: new StubAuthGate(),
    ...overrides,
  }
}
