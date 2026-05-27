# ADR 0005: DB seam through repos only

## Status
Accepted

## Context
The fastest way to make an app un-refactorable is to scatter DB client calls across handlers, use-cases, and ad-hoc utility files. Once that happens, swapping DB drivers, adding observability, or introducing read replicas requires combing every file.

This is even worse with agents, who will reach for the nearest DB client they can find.

This ADR retains the **ADR-0005 number** to match the EmberForge codebase's equivalent decision, preserving continuity for cross-repo readers.

## Decision
**All database access goes through repositories.** No direct DB client (`pg`, `postgres`, drivers, Supabase admin SDK) anywhere outside `infra/postgres-*-repository.ts` files inside an API module.

Enforcement:
- A Biome lint rule (added when `apps/api` lands in Phase 2) bans DB client imports outside the allowlist.
- The structure validator (extended in later phases) verifies that repository files live in the correct module folder.
- Use-cases receive repository ports via DI (per ADR-0003) and never reference concrete repos.

## Consequences
- Repository files are the single seam for query observability, caching, retries, and dialect changes.
- Read replicas, sharding, or DB swaps require touching only repository implementations.
- Cost: every DB-touching feature must declare a port + repository. This tax is intentional.
- Agents that try to `import { sql } from "@neondatabase/serverless"` inside a use-case will get lint errors. This is the point.
