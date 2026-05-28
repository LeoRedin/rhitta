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
//
// Phase 2b Task 6 — Type-surface enhancement.
//
//   Task 5 shipped a structural placeholder (`Client` with no methods).
//   Task 6 builds TanStack Query wrappers on top of it; those wrappers need
//   typed method signatures to compile. Per the Task 6 brief, "ENHANCE the
//   placeholder file in this task to declare the type surface that
//   Phase 2a's API endpoints will produce" is an allowed extension.
//
//   The method signatures below mirror the wire shapes declared at
//   `apps/api/src/modules/{notes,agent-runs}/http/*.ts`. The namespace
//   layout (`client.notes.*`, `client.agentRuns.*`) is the conventional
//   Encore output when each module is grouped into a service-local API
//   surface. If the real generated client lands with a different layout
//   (e.g., flat `client.api.*` because Encore strips the single-service
//   prefix), the queries layer can be re-pointed without breaking the
//   contract types themselves — those come from `@rhitta/contracts` and
//   are the source of truth.
// =============================================================================

import type { AgentRunRequest, AgentRunResponse } from '@rhitta/contracts/agent-runs'
import type { CreateNote, ListNotesQuery, Note, UpdateNote } from '@rhitta/contracts/notes'

const REGEN_HINT =
  '@rhitta/web api-client is the placeholder shipped by Phase 2b Task 5. ' +
  'Run `pnpm --filter @rhitta/web gen:api-client` (requires `encore auth login` ' +
  'and one prior `encore run`) to replace this file with the real Encore-generated ' +
  'client. See apps/web/src/lib/api-client/README.md and ADR-0020 for details.'

/** Wire-shape of `GET /notes` response. Mirrors `ListNotesResponseSchema` in apps/api. */
export interface ListNotesResponse {
  items: Note[]
  nextCursor: string | null
}

/** Typed namespace covering the `notes` module endpoints. */
export interface NotesNamespace {
  list(query: ListNotesQuery): Promise<ListNotesResponse>
  get(id: string): Promise<Note>
  create(input: CreateNote): Promise<Note>
  update(input: UpdateNote & { id: string }): Promise<Note>
  delete(id: string): Promise<void>
}

/** Typed namespace covering the `agent-runs` module endpoints. */
export interface AgentRunsNamespace {
  run(input: AgentRunRequest): Promise<AgentRunResponse>
}

/**
 * Placeholder Encore client.
 *
 * The real generated client (after `encore gen client`) exports a `Client`
 * class and a default `BaseURL` constant. To keep TypeScript consumers
 * compilable, we expose the same names but throw on instantiation. The
 * typed `notes` / `agentRuns` namespaces are declared as instance fields
 * so consumers (TanStack Query wrappers in `lib/queries/`) type-check
 * today against the same surface the real client will expose.
 */
export class Client {
  readonly notes!: NotesNamespace
  readonly agentRuns!: AgentRunsNamespace

  constructor(_target: BaseURL, _options?: ClientOptions) {
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
