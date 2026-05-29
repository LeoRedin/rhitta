# Rhitta — Post-Phase-2c Next Steps Handoff

**Date:** 2026-05-28
**For:** Fresh agent picking up Rhitta after Phase 2c shipped. Job is to grill the user on what comes next, then write the plan and execute.
**Repo:** `/Users/redin/Projects/personal/rhitta`
**Branch state:** `main`, HEAD `a2ccafd` on `origin/main`. Clean. Phase 2c complete.

---

## What just shipped

`apps/mobile` end-to-end:
- Ignite scaffold + `rhitta-overlay.sh` post-install patch (ADR-0025)
- Expo Router file-based routing with single auth gate (ADR-0023)
- Zustand replaces MobX (ADR-0024)
- 8 design-system-mobile primitives via Ignite themed factory
- Better Auth + Expo SecureStore + magic-link deep linking
- TanStack Query wrappers, Notes screens (list/new/detail/edit), agent demo
- Centralized realtime hook factory consuming `note-created`
- Structure-validator 11th check for mobile auth gate
- `@rhitta/biome-config/mobile-app` variant

Rhitta v0 is feature-complete. 25 ADRs (0001-0025) lock the architecture.

---

## Read these first

1. `docs/handoffs/rhitta-phase-2c-handoff.md` — what Phase 2c locked.
2. The Phase 0 handoff (in `docs/handoffs/` if it was moved there, or originally `rhitta-phase-0-handoff.md`) — the "After Phase 2c" + "Validation milestone" sections at the bottom.
3. `docs/adr/README.md` — index of all 25 ADRs.
4. `AGENTS.md` — repo rules.
5. `CONTEXT.md` — glossary.
6. Memory at `/Users/redin/.claude/projects/-Users-redin-Projects-personal-rhitta/memory/` — `rhitta-phases.md` should have Phase 2c marked shipped after the prior agent's wrap-up; verify and update if missing.

---

## Two parallel tracks the user must choose between (or run in parallel)

Per the Phase 0 lock and ADR-0010 (fixed versioning), the next two things in flight are:

### Track A — Wife's-app validation milestone (Phase 2.x)

The Phase 0 handoff established this gate: **Leo's wife rewrites her mobile app on top of Rhitta v0. Whatever breaks during that rewrite gets fixed in a Rhitta v0.1 release before EmberForge's design system migration starts. Rhitta does not publish to npm before this milestone.**

The wife's app rewrite is the canonical first real-world consumer of Rhitta. Work flowing from this track is:
- Smoke-test the v0 by scaffolding a new project from `apps/mobile` shape (or from the soon-to-exist `create-rhitta` CLI if Phase 3 ships first)
- Track bugs / friction points / missing primitives / unclear docs from her rewrite
- Fix in `main` as small typed PRs
- Cut v0.1 release once the rewrite ships
- Then unlock npm publish

This track is **non-deterministic** — the work depends on what breaks. Best run by Leo + occasional Claude help, not as a continuous-implementation phase.

### Track B — Phase 3 (`create-rhitta` CLI + generators + e2e)

Per the Phase 0 handoff "After Phase 2c" + ADR mentions throughout:
- `create-rhitta` CLI scaffolds new Rhitta projects (`npx create-rhitta my-app`). Wraps `npx ignite-cli new` + `rhitta-overlay.sh` for mobile, Vite + Tanstack Start scaffold for web, Encore.ts scaffold for api, all the workspace plumbing.
- Extended structure-validator: module + import boundary + naming checks across all platforms (the AST-level checks ADR-0011 currently defers).
- Generators (`gen:module`, `gen:resource`, `gen:agent`, `gen:primitive`) that emit boilerplate honoring the conventions.
- Playwright e2e for web + Maestro for mobile (deferred from Phases 2b/2c respectively).

This track is **deterministic** — has a clear scope, can be planned in a single grilling session and implemented in a 13-task-per-sub-phase pattern (matching how 2a/2b/2c shipped).

### Track ordering question for the user

Phase 0's locked order is **Track A first, then Track B**. But:
- Wife's-app rewrite is gated on her availability + may move slowly.
- Phase 3's generators would *accelerate* the wife's rewrite if they ship first (she scaffolds via `create-rhitta` instead of copying `apps/mobile`).
- Phase 3 is more "buildable" right now.

Ask the user: do they want to **(a)** wait for wife's-app feedback before any more Rhitta work (Track A drives), **(b)** start Phase 3 in parallel (so generators are ready when the wife's-app reveals friction), or **(c)** start Phase 3 fully (Track A becomes purely reactive bug-fixing on top of a finished v1).

There may also be **(d)** a release-readiness pass: claim the npm scope (Leo manual action queued from Phase 1; verify whether Leo did it), set up a v0.1.0 changeset workflow dry-run, write the public-facing README, audit AGENTS.md for downstream-consumer perspective. Small but useful before the wife's rewrite formally begins.

Drive hard recommendations and let the user pick.

---

## Suggested grilling flow

Use `grill-with-docs` (already installed) to grill. Sample open questions to surface:

1. **Track A vs B vs both:** which to start now, and what success looks like for the next session.
2. **`create-rhitta` CLI shape:** Node-only or Bun-compatible? Interactive prompts via `@inquirer/prompts` or `clack`? What does the scaffolded output look like — does it include all three apps or let the user pick?
3. **Generator UX:** `pnpm gen:resource users` interactive vs argument-driven? Templates as `.hbs` (Handlebars) or hand-rolled string templates?
4. **Structure-validator AST checks:** TypeScript AST library (`ts-morph`, `typescript-eslint-parser`, raw `typescript`)? Phase 3 expands check count from 11 to ~15-20 (module imports, cross-module deep-import bans, naming conventions, etc.).
5. **Playwright + Maestro setup:** ship as a workspace task or as part of `apps/web` and `apps/mobile` respectively? CI integration?
6. **Release readiness:** has Leo claimed `@rhitta` on npm? Was the `NPM_TOKEN` GitHub secret added? Has the placeholder Encore client been regenerated yet (was deferred in Phase 2b Task 5 pending Encore Cloud auth)?
7. **Branding + public README:** Rhitta has internal docs but no consumer-facing README beyond the basic one. Worth a polish pass before any real publish — Phase 2.5 or a side task.

---

## Workflow conventions (carried over)

- Pattern: `superpowers:subagent-driven-development` for execution after grilling.
- Direct-on-main authorized (Phases 2a/2b/2c all shipped that way).
- No `Co-Authored-By`. Author = Leo per global git config.
- `rtk proxy ` prefix on `pnpm` / `git commit` / `git push` locally.
- Conventional commits, HEREDOC body for multi-line.
- Memory updates after each shipped phase.
- ADRs follow the established format (Status / Context / Decision / Consequences). 25 already shipped — next would be 0026.
- Stable handoff paths in `docs/handoffs/`. NO mktemp temp paths; previous attempts had nested-code-fence parser issues.
- Skip formal spec + code review subagents per Leo's standing directive. Self-review + lefthook gate.

---

## Known carry-over items (NOT blocking next phase, but worth tracking)

1. **Encore client placeholder** at `apps/web/src/lib/api-client/api-client.ts` and the mobile equivalent. Real generation deferred pending `ENCORE_AUTH_TOKEN` + Encore Cloud login. CI step exists but is commented out (`.github/workflows/ci.yml`).
2. **Leo's manual actions queued from Phase 1:** claim the `@rhitta` npm org, add `NPM_TOKEN` GitHub secret. Required before any release attempt.
3. **`apps/api`'s `infra.config.json`** for self-hosted deploy is not yet authored. Surfaced by Phase 2a Task 28's `encore build docker` attempt. Lands in the first real-deploy pass.

---

## Suggested skills

- `grill-with-docs` — for the Track A vs B conversation + any sub-phase grilling.
- `superpowers:writing-plans` — only if the user wants a plan written without immediate implementation.
- `superpowers:subagent-driven-development` — once a plan exists and the user wants execution.
- Standard Read/Edit/Write/Bash for coordination.

Skip `verify` for now — there's nothing new to smoke-test until execution begins.

---

End of post-Phase-2c next-steps handoff.
