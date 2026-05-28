import { type AppDeps, composeTestRoot } from './composeRoot.js'
import type { InMemoryEventPublisher } from './pub-sub.js'

/**
 * Builds a fresh `AppDeps` graph wired with in-memory adapters for
 * use-case tests. The return type narrows `eventPublisher` to
 * `InMemoryEventPublisher` so tests can read its `published` log
 * without a cast.
 *
 * Pass `overrides` to swap individual adapters (e.g. a spy `AuthGate`).
 */
export function makeTestDeps(overrides: Partial<AppDeps> = {}): AppDeps & {
  eventPublisher: InMemoryEventPublisher
} {
  const deps = composeTestRoot(overrides)
  return deps as AppDeps & { eventPublisher: InMemoryEventPublisher }
}
