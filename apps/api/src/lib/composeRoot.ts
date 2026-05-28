/**
 * The wiring root for the API. Reads env vars, constructs every adapter
 * the running service needs, and installs them into the module-scoped
 * singletons HTTP handlers reach for (per ADR-0003 — module DI pattern).
 *
 * Important properties:
 *
 *   - Env is read in exactly one place: {@link readEnv}. Every other file
 *     in this service is constructor-injected.
 *   - Adapters that require external credentials (Anthropic, Resend, S3)
 *     fall back to in-memory implementations when their env is missing,
 *     so `pnpm dev` works without a full `.env`. Production deploys MUST
 *     set every variable — see `.env.example`.
 *   - `composeRoot()` returns `void`. Its job is to install singletons,
 *     not to hand back a deps graph. Tests that need a deps graph
 *     instead construct modules directly via `registerNotesModule(...)`
 *     / `registerAgentRunsModule(...)` with their own in-memory adapters.
 *   - Safe to call more than once: each call re-publishes the singletons,
 *     overwriting the previous instances. We don't expect more than one
 *     call in practice (Encore loads `encore.service.ts` once at boot).
 */
import { InMemoryEmailAdapter } from '../adapters/in-memory-email-adapter.js'
import { InMemoryStorageAdapter } from '../adapters/in-memory-storage-adapter.js'
import { ResendEmailAdapter } from '../adapters/resend-email-adapter.js'
import { S3StorageAdapter } from '../adapters/s3-storage-adapter.js'
import { AnthropicAgentAdapter } from '../modules/agent-runs/infra/anthropic-agent-adapter.js'
import { InMemoryAgentAdapter } from '../modules/agent-runs/infra/in-memory-agent-adapter.js'
import { registerAgentRunsModule, setAgentRunsModule } from '../modules/agent-runs/module.js'
import { BetterAuthGate } from '../modules/auth/infra/better-auth-gate.js'
// Side-effect import: pulls in `authHandler` (the `/auth/*` raw endpoint)
// so Encore's static analysis sees the route declaration.
import '../modules/auth/module.js'
import { PostgresNoteRepository } from '../modules/notes/infra/postgres-note-repository.js'
import { registerNotesModule, setNotesModule } from '../modules/notes/module.js'
import { setAuthGate } from './auth-gate-instance.js'
import { orm } from './db.js'
import { EncoreEventPublisher } from './pub-sub.js'

/**
 * Env shape consumed by {@link composeRoot}. Every value is optional at
 * the type level so the function never crashes on missing config — the
 * in-memory fallbacks make local dev workable. A missing var only blows
 * up at the moment the corresponding adapter is invoked (e.g. trying to
 * send an email without `RESEND_API_KEY` would hit the in-memory adapter
 * and silently log; trying to upload to S3 without credentials would
 * never reach the S3 client).
 */
export type AppEnv = {
  ANTHROPIC_API_KEY: string | undefined
  RESEND_API_KEY: string | undefined
  S3_ENDPOINT: string | undefined
  S3_REGION: string | undefined
  S3_ACCESS_KEY_ID: string | undefined
  S3_SECRET_ACCESS_KEY: string | undefined
  S3_BUCKET: string | undefined
}

/** Snapshot `process.env` into a typed bag. Pure — no side effects. */
export function readEnv(): AppEnv {
  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET: process.env.S3_BUCKET,
  }
}

/**
 * Production wiring. Idempotent: each call overwrites the previously-
 * installed singletons. Defaults to {@link readEnv} but accepts an
 * explicit `AppEnv` so a future bootstrap (or a test) can wire from a
 * different source without touching `process.env`.
 */
export function composeRoot(env: AppEnv = readEnv()): void {
  // -- Auth gate -------------------------------------------------------------
  setAuthGate(BetterAuthGate.production())

  // -- Edge adapters (fall back to in-memory when creds missing) ------------
  const emailSender = env.RESEND_API_KEY
    ? new ResendEmailAdapter(env.RESEND_API_KEY)
    : new InMemoryEmailAdapter()

  const storage =
    env.S3_ENDPOINT &&
    env.S3_REGION &&
    env.S3_ACCESS_KEY_ID &&
    env.S3_SECRET_ACCESS_KEY &&
    env.S3_BUCKET
      ? new S3StorageAdapter({
          endpoint: env.S3_ENDPOINT,
          region: env.S3_REGION,
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
          bucket: env.S3_BUCKET,
        })
      : new InMemoryStorageAdapter()

  // `emailSender` and `storage` are constructed here so wiring is honest
  // about which env vars matter, but no module consumes them yet. They
  // land in the singleton scope of a future module (e.g. an `attachments`
  // module would receive `storage`, the magic-link sender would receive
  // `emailSender`).
  void emailSender
  void storage

  // -- Notes module: Postgres + Encore PubSub -------------------------------
  const eventPublisher = new EncoreEventPublisher()
  setNotesModule(
    registerNotesModule({
      eventPublisher,
      repository: new PostgresNoteRepository(orm),
    })
  )

  // -- Agent-runs module: Anthropic when keyed, else in-memory --------------
  const provider = env.ANTHROPIC_API_KEY
    ? new AnthropicAgentAdapter(env.ANTHROPIC_API_KEY)
    : new InMemoryAgentAdapter()
  setAgentRunsModule(registerAgentRunsModule({ provider }))
}
