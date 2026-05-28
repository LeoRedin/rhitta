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
 * The `authGate` is still a `StubAuthGate` at this point — Task 4
 * replaces it with a Better Auth-backed implementation.
 */
export function composeRoot(): AppDeps {
  return {
    eventPublisher: new EncoreEventPublisher(),
    authGate: new StubAuthGate(),
  }
}

/**
 * Test root. Returns in-memory adapters so use-case tests can run
 * without any external infrastructure. `overrides` lets a test swap in
 * a custom adapter (e.g. a hand-rolled spy `AuthGate`).
 */
export function composeTestRoot(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    eventPublisher: new InMemoryEventPublisher(),
    authGate: new StubAuthGate(),
    ...overrides,
  }
}
