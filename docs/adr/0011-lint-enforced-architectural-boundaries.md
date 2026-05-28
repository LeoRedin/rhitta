# ADR 0011: Lint-enforced architectural boundaries (forward-spec)

## Status
Proposed — implementation deferred to Phase 2 when target apps land.

## Context
Several Rhitta architectural rules — "DB clients only inside repositories," "vendor SDKs only inside adapters," "realtime transports only inside the centralized hook" — are most usefully enforced at lint time. Biome 2.x's `noRestrictedImports` rule can express these as `import X is forbidden unless the file matches glob Y`.

The catch: the file globs that define *where* an import is permitted (e.g., `apps/api/src/modules/*/infra/postgres-*-repository.ts`) don't exist yet. Phase 1 has no apps and no modules. Encoding the rules now with empty allowlists would actively mislead — a future agent reads `noRestrictedImports.paths: []` and concludes "no restriction."

Two alternatives considered:
1. **Defer the bans entirely with no forward record** — risk: Phase 2 agents and engineers rediscover the rules from scratch and may converge on a weaker set.
2. **Scaffold empty allowlists in `@rhitta/biome-config` now** — risk: misleading dormancy. Worse than no record.
3. **Document the intended bans in an ADR as `Proposed`, implement in Phase 2** — preserves intent without misleading.

## Decision
Adopt option 3: ship `@rhitta/biome-config` in Phase 1 **without** the architectural ban rules. Capture the *intended* rules here, as `Proposed`. Phase 2a (when `apps/api` lands) implements the API-side bans; Phase 2b (web) and Phase 2c (mobile) implement their respective bans. When implemented, this ADR's status flips to `Accepted` and a child ADR per ban may be created if needed.

The Phase 2 implementation will encode, at minimum, the following rules via Biome's `noRestrictedImports` plus `overrides` for path scoping:

| Banned import | Allowed only inside | Justification |
|---------------|---------------------|---------------|
| `pg`, `postgres`, any direct DB driver | `apps/api/src/modules/*/infra/postgres-*-repository.ts` | ADR-0005 |
| `@supabase/supabase-js` admin client | `apps/api/src/modules/auth/infra/**` (TBD) | Hexagonal boundary (ADR-0002) |
| `supabase.channel(...)` / raw realtime transports | `apps/web/src/lib/realtime/**` (centralized hook factory) | AGENTS.md rule 9 |
| `stripe`, `@aws-sdk/*`, vendor SDKs generally | corresponding `infra/<vendor>-*.ts` adapters | ADR-0002 |
| `useState` for canonically server-derived data | banned everywhere (warn only; structurally hard to lint) | AGENTS.md rule 8 |
| Cross-module deep imports (`apps/api/src/modules/X/...` from `modules/Y/`) | only via each module's `registerXModule` public surface | ADR-0003 |

A separate set of structural checks (folder shape, `domain/application/infra/http` layout) belongs to `tools/structure-validator` per ADR-0003, not to Biome. Both layers complement each other; do not double-track.

## Consequences
- Phase 1 ships `@rhitta/biome-config` as `base` + `react`, no ban rules. Apps and packages adopt it cleanly.
- The intent is durable and PR-traceable. Phase 2 implementers either honor this list or write a superseding ADR.
- Cost: this ADR is itself speculative until Phase 2 lands. Marked `Proposed` to signal that.
- When Phase 2 implements, a follow-up commit updates this ADR's status and links to the actual Biome config diffs.
