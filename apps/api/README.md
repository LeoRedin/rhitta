# @rhitta/api

The Rhitta backend — an [Encore.ts](https://encore.dev) service hosting the `notes`, `auth`, and `agent-runs` modules.

## Run locally

Prerequisites: **Docker running** + the **Encore CLI** (`curl -fsSL https://encore.dev/install.sh | bash`, or the workspace-local install from `scripts/build-docker.sh`).

```bash
pnpm dev:api          # from the repo root — or: pnpm --filter @rhitta/api dev (encore run)
```

**No manual database setup.** On `encore run`, Encore provisions a local Postgres in Docker, injects `DATABASE_URL`, and applies the Drizzle migrations (`src/lib/drizzle/`) on startup.

**No required env for local dev.** `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` have dev fallbacks, and Anthropic/Resend/S3 fall back to in-memory adapters when unset. A `.env` (copied from `.env.example` at scaffold time, gitignored) is loaded automatically via `dotenv` — drop in real keys there when you want the live adapters. Magic-link URLs are logged to the `encore run` console in dev.

## Architecture

Hexagonal + module-DI ([ADR-0002](../../docs/adr/0002-hexagonal-architecture.md), [ADR-0003](../../docs/adr/0003-module-di-pattern.md), [ADR-0015](../../docs/adr/0015-single-encore-service-multi-module.md)). One Encore service; each feature is a self-contained module under `src/modules/<feature>/` with exactly four layers:

```
src/modules/<feature>/
  domain/        entities + domain rules (no framework, no I/O)
  application/   use-cases; depend on ports, never on vendor SDKs
  infra/         adapters: repositories (the only place DB drivers are imported) + external-service adapters
  http/          Encore endpoints; thin, delegate to use-cases
```

Cross-cutting bits live in `src/lib/` (error mapper, Pub/Sub, Drizzle migrations, Better Auth gate, type asserts). Modules are composed at the root via `composeRoot` / `registerXModule`.

## Conventions (enforced)

- **DB access only through repositories** (`infra/postgres-*-repository.ts`) — [ADR-0005](../../docs/adr/0005-db-seam-through-repos.md).
- **Validation only via Zod** from `@rhitta/contracts` — [ADR-0004](../../docs/adr/0004-zod-as-sole-validator.md).
- **External services through typed ports + adapters** (email/Resend, storage/S3, agent/Anthropic), each with an in-memory adapter for tests — [ADR-0002](../../docs/adr/0002-hexagonal-architecture.md).
- **Typed domain errors** mapped to HTTP status once in `src/lib/error-mapper.ts` — [ADR-0018](../../docs/adr/0018-domain-errors-central-mapper.md).
- Drizzle migrations live in `src/lib/drizzle/` — [ADR-0016](../../docs/adr/0016-drizzle-orm-canonical-repository.md).

The architectural import bans are enforced by `@rhitta/biome-config/api-app` and the structure validator.

## Endpoints

`/auth/*` (Better Auth), `POST/GET/PATCH/DELETE /notes`, `GET /notes/:id`, `POST /agent-runs`.

## Test

```bash
pnpm --filter @rhitta/api test        # Vitest (+ Testcontainers Postgres integration tests)
```

## Environment

Copy `.env.example` and fill in secrets (Postgres, Resend, S3/R2, Anthropic). The Encore app id is `id` in `encore.app`.
