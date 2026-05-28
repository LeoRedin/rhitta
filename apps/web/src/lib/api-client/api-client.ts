// =============================================================================
// api-client.ts — PLACEHOLDER. Replaced by `encore gen client` output.
// =============================================================================
//
// Per ADR-0020, this file is the Encore-generated TypeScript SDK that wraps
// every `apps/api` endpoint. It is committed to the repo and consumed via
// `import { client } from '~/lib/api-client'`.
//
// Why a placeholder, not the real client (Phase 2b Task 5):
//   `encore gen client rhitta --lang typescript` requires either:
//     (a) the app to have been run locally at least once via `encore run`,
//         which in turn requires `encore auth login` to fetch development
//         secrets metadata from encore.cloud (even when the app uses
//         `process.env` directly — Encore's daemon hits the cloud
//         unconditionally on startup), OR
//     (b) the app to be linked to an Encore Cloud environment whose
//         metadata can be fetched with `--env=<name>`.
//
//   Neither path is available in a non-interactive harness without an
//   `encore auth login` session. The author of Task 5 documented this
//   defer path — ship the infrastructure (script, CI hook seam, README,
//   index re-export, web-app biome allowlist) so the first developer
//   with an Encore Cloud login can run the script and commit the real
//   output without touching anything else.
//
// To replace this file with the real generated client:
//
//   1. `encore auth login`                                  (one-time)
//   2. `pnpm --filter @rhitta/api dev` and let it boot once  (populates
//      the Encore daemon's metadata cache for the rhitta app)
//   3. Ctrl-C the dev server
//   4. `pnpm --filter @rhitta/web gen:api-client`            (this script
//      overwrites this file with the generated SDK)
//
// Until then, importing from this module throws at runtime and TanStack
// Query wrappers built on it will fail loudly — exactly the right signal
// for a missing infrastructure piece.
// =============================================================================

const REGEN_HINT =
  '@rhitta/web api-client is the placeholder shipped by Phase 2b Task 5. ' +
  'Run `pnpm --filter @rhitta/web gen:api-client` (requires `encore auth login` ' +
  'and one prior `encore run`) to replace this file with the real Encore-generated ' +
  'client. See apps/web/src/lib/api-client/README.md and ADR-0020 for details.'

/**
 * Placeholder Encore client.
 *
 * The real generated client (after `encore gen client`) exports a `Client`
 * class and a default `BaseURL` constant. To keep TypeScript consumers
 * compilable, we expose the same names but throw on instantiation.
 */
export class Client {
  constructor(_target: string, _options?: ClientOptions) {
    throw new Error(REGEN_HINT)
  }
}

export type BaseURL = string
export const Local: BaseURL = 'http://localhost:4000'
export const Environment = (name: string): BaseURL => `https://${name}-rhitta.encr.app`

export interface ClientOptions {
  fetcher?: typeof fetch
  auth?: unknown
}
