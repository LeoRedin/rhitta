// =============================================================================
// client.ts — QueryClient factory + Encore Client singleton accessor.
// =============================================================================
//
// Two singletons live here:
//
//   1. `getApiClient()` — lazy Encore `Client` instance. Constructed once
//      per process, reused by every TanStack Query hook in this folder.
//      The `BaseURL` comes from `VITE_API_URL` (Vite-injected) or the
//      `Local` default. `setApiClientForTesting(...)` is the test-only
//      escape hatch: each test installs a mocked client and resets it in
//      teardown.
//
//   2. `createQueryClient()` — factory that returns a fresh `QueryClient`
//      with Rhitta's defaults (staleTime 30s, gcTime 5m, retries 2 for
//      reads / 0 for writes, no window-focus refetch). The SSR boundary
//      (TanStack Start) calls this once per request on the server and the
//      hydrated client mounts a sibling instance — both share defaults.
//
// Per ADR-0020, components consume the wrappers in `notes.ts` /
// `agent-runs.ts`; this file is internal to the queries layer.
// =============================================================================

import { QueryClient } from '@tanstack/react-query'
import { Client, Local } from '../api-client/index.js'

let _apiClient: Client | null = null

/**
 * Lazy accessor for the singleton Encore client.
 *
 * Instantiated on first call; reused thereafter. SSR and hydrated client
 * share the same wired baseURL because `import.meta.env.VITE_API_URL` is
 * substituted at build time by Vite — same value on server and browser.
 */
export function getApiClient(): Client {
  if (_apiClient === null) {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    const baseURL = env?.VITE_API_URL ?? Local
    _apiClient = new Client(baseURL)
  }
  return _apiClient
}

/**
 * Test-only seam: replace the singleton with a mocked `Client`-shaped
 * object. Pass `null` in `afterEach` to reset state between tests.
 */
export function setApiClientForTesting(client: Client | null): void {
  _apiClient = client
}

/**
 * Build a fresh `QueryClient` with Rhitta's read/write defaults.
 *
 * Defaults chosen for the v0 surface:
 * - `staleTime: 30_000` — 30s window where cached data is considered
 *   fresh. Hides redundant refetches on quick route hops without
 *   serving stale data to interactive users.
 * - `gcTime: 5 * 60_000` — 5m before unused entries are dropped.
 * - `retry: 2` for queries (catches transient 5xx / network blips).
 * - `retry: 0` for mutations (writes should fail loudly; the caller
 *   decides whether to retry user-visible actions).
 * - `refetchOnWindowFocus: false` — surprises users; we prefer explicit
 *   invalidations from mutations.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}
