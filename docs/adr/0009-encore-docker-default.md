# ADR 0009: Encore.ts + Docker as the default API stack

## Status
Accepted

## Context
The API stack choice locks in the deployment story, the type-safety story between server and client, the observability defaults, and the migration ergonomics. Alternatives considered:
- **Plain Fastify / Hono** — flexible but every project re-invents service definitions, RPC clients, and observability wiring.
- **tRPC** — excellent type safety but couples client and server tightly in ways that don't suit a multi-app monorepo (web *and* mobile *and* future consumers).
- **Encore.ts** — typed service definitions, generated client SDKs, built-in observability, Pub/Sub primitives, runs anywhere Docker runs. Strong fit for a long-lived multi-app monorepo.

Deployment target: **Docker** as the default, because it works on every cloud (Fly, Render, Railway, Cloud Run, ECS, bare metal) without lock-in. Encore Cloud is a path, not a requirement.

## Decision
- **`apps/api`** uses Encore.ts.
- The default DB is Postgres on Neon (free tier friendly, branchable).
- **Better Auth** is the default auth adapter behind the auth port (per ADR-0002).
- Deployment ships as a **Docker image**. Encore Cloud is an opt-in alternative, not the default.

## Consequences
- Type-safe service definitions and generated client SDKs come for free.
- Observability primitives (traces, metrics, logs) ship with the framework.
- Portable Docker output keeps cloud choice flexible.
- Cost: Encore.ts is less ubiquitous than Fastify or Express. The team commits to learning it. Worth it for the integrated story.
- The auth adapter pattern means Better Auth can be swapped for Clerk, Auth0, or self-rolled later without restructuring the app.
