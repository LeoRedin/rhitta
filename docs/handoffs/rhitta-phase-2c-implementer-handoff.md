# Phase 2c Implementer Handoff

**Date:** 2026-05-28
**For:** Fresh agent implementing Rhitta Phase 2c (`apps/mobile`).
**Repo:** `/Users/redin/Projects/personal/rhitta`
**Branch state:** `main`, HEAD `671d714` on `origin/main`. Clean.

---

## Read these first (do not duplicate — read them)

1. `docs/handoffs/rhitta-phase-2c-handoff.md` — full 13-task plan, locked decisions, directory shape, acceptance criteria. This is the spec.
2. `docs/handoffs/rhitta-phase-2b-handoff.md` — apps/web mirror. Look here whenever a mobile screen / hook / slice has an obvious web analogue.
3. `CONTEXT.md` — glossary. Look up Auth gate (mobile), Rhitta overlay (mobile).
4. ADRs `0023-0025` — driving decisions for Phase 2c.
5. ADRs `0006-0008`, `0011-0012`, `0017`, `0019-0022` — cross-platform conventions you'll mirror.
6. `AGENTS.md` — rules 8 (state), 9 (realtime), 10 (auth gate).

Skip Phases 0/1/2a unless something references them.

---

## What's on `main` (don't redo)

`origin/main` HEAD `671d714` contains:
- All Phases 0/1/2a/2b commits.
- Phase 2c planning commit (`671d714`) — ADRs 0023-0025 + Phase 2c handoff + CONTEXT.md updates.

Verify after clone: `git log --oneline -5`.

---

## 13 tasks to ship

Full per-task specs live in `docs/handoffs/rhitta-phase-2c-handoff.md` under "Implementation order". Cliffs:

1. `@rhitta/biome-config/mobile-app` variant + structure-validator BIOME_VARIANT_MAP update.
2. `apps/mobile` Ignite scaffold + `scripts/rhitta-overlay.sh` post-install script. Updates structure-validator TSCONFIG and BIOME maps for `apps/mobile`.
3. `@rhitta/design-system-mobile` — 8 RN primitives via Ignite themed factory consuming `@rhitta/design-tokens/semantic`.
4. `@rhitta/design-system-mobile/forms` — `createZodForm` mirroring web's API.
5. `apps/mobile` Encore client generation script + placeholder file (same pattern as Phase 2b Task 5).
6. `apps/mobile` TanStack Query wrappers — mirror `apps/web/src/lib/queries/` 1:1.
7. `apps/mobile` Better Auth RN client + Expo SecureStore + magic-link deep link.
8. `apps/mobile` Zustand slices: `useTheme` (SecureStore-persisted) + `useToastQueue`.
9. `apps/mobile` Expo Router skeleton + single auth gate at `app/_authenticated/_layout.tsx`.
10. `apps/mobile` Notes screens (list, new, detail, edit).
11. `apps/mobile` agent demo screen.
12. `apps/mobile` realtime hook factory (polyfill or WebSocket transport, same hook signature as web).
13. Structure-validator 11th check: confirm `apps/mobile/app/_authenticated/_layout.tsx` exists with auth gate.

---

## Workflow conventions

- **Pattern:** `superpowers:subagent-driven-development`. SKIP formal spec + code review subagents per user directive. Rely on implementer self-review + lefthook pre-commit (biome + structure-validate + typecheck) + commitlint.
- **Direct-on-main authorized.** No feature branch. One conventional commit per task with the exact subject specified in each task prompt.
- **No `Co-Authored-By`** on commits. Author = Leo (configured globally as `leoredin@hey.com`).
- **`rtk proxy ` prefix** on all `pnpm` / `git commit` / `git push` commands. Bypasses a false-OOM Linter warning from the local RTK shell hook. Read-only `git status` / `git log` work without it.
- **HEREDOC body** for multi-line commit messages.
- **Push after each task is OK** (cheap CI feedback) OR push at the end. Phase 2b pushed in batches; Phase 2a pushed at the end. Either works.
- **Memory** at `/Users/redin/.claude/projects/-Users-redin-Projects-personal-rhitta/memory/`. Update `rhitta-phases.md` after Phase 2c ships and CI passes.

---

## Known gotchas

1. **Ignite scaffold creates files outside your control.** The overlay (Task 2) lands AFTER `npx ignite-cli new`. Expect to read what Ignite generated, then patch. Idempotent — run the overlay twice to verify.

2. **pnpm + Expo + Metro monorepo resolution.** Metro defaults don't follow pnpm symlinks correctly. The overlay must patch `metro.config.js` to include `watchFolders` covering the repo root and `nodeModulesPaths` pointing at `apps/mobile/node_modules` first. This is documented for Expo SDK 50+; verify against the installed Expo version.

3. **Encore client placeholder.** `apps/web/src/lib/api-client/api-client.ts` is a hand-written placeholder (Phase 2b Task 5 deferred actual generation pending Encore Cloud auth). `apps/mobile` follows the same pattern — ship a placeholder, defer real generation, document in README.

4. **RN has no `EventSource`.** Task 12's transport picks between `react-native-event-source` polyfill OR raw WebSocket. Either works; the hook signature is identical to web's. Document the choice in the transport file.

5. **Magic link deep linking.** Better Auth's React client + Expo Linking + URL scheme in `app.json`. The auth API on apps/api emits a magic-link URL pointing at the app's scheme (e.g., `rhitta://auth/callback?token=...`). The mobile app's `app/auth/callback.tsx` handles it via Expo Router's params + `authClient.magicLink.verify({ token })`. Test paths: tap link from email client, confirm app opens at callback screen, confirm session set, confirm redirect to `/home`.

6. **Expo SecureStore is async.** Zustand `persist` middleware's default storage assumes sync. Use `createJSONStorage(() => ({ getItem, setItem, removeItem }))` wrapping SecureStore's promise-returning API. Web's `useTheme` slice (Phase 2b Task 36) is a reference, but mobile needs the async wrapper.

7. **Ignite themed factory** expects a theme object with specific shape (`colors`, `spacing`, `typography`). The overlay rewrites `app/theme/colors.ts` etc. to import from `@rhitta/design-tokens/semantic` instead of hand-defining. The themed factory consumes these. design-system-mobile primitives then use Ignite's `useAppTheme()` hook to access values.

8. **No SSR on mobile.** Web's `_authenticated/route.tsx` `beforeLoad` runs server-side. Mobile's `_authenticated/_layout.tsx` runs at app startup on the device. Use Expo Router's `<Redirect>` for the redirect-when-unauthenticated case; no `throw redirect()` pattern.

9. **`pnpm validate` includes `@rhitta/mobile`** only after Task 2 lands. Earlier tasks (variant config) typecheck the validator + biome-config — validate stays green at every step.

10. **Auto-mode classifier outages.** Bash + Agent dispatches occasionally hit "classifier unavailable" or 529/socket errors. Retry the same call after a brief pause. Phase 2b saw this twice; Phase 2c likely too.

11. **Nested triple-backtick code blocks in handoff docs break some parsers.** When writing handoffs or large prompts, avoid nesting code fences. The Task 39 dispatch in Phase 2b hit this.

---

## Acceptance — Phase 2c done when

Per the 13-item Acceptance criteria in `docs/handoffs/rhitta-phase-2c-handoff.md`. After Tasks 1-13 + push + CI green:

- ADRs 0023-0025 Accepted
- ADR-0011 implementation table reflects mobile-app bans
- All 11 structure-validator checks pass
- App boots in iOS simulator + Android emulator; sign-in → create note → list → agent demo → realtime list refresh all work end-to-end
- Memory `rhitta-phases.md` updated

Then the wife's-app validation milestone is unblocked.

---

## Suggested skills

- `superpowers:subagent-driven-development` — fire it; same pattern as Phases 2a/2b.
- Standard Read/Edit/Write/Bash for coordination.
- `verify` at the end for simulator smoke test (also needs apps/api running locally).

Skip `grill-with-docs` — decisions locked in ADRs 0023-0025.

---

End of Phase 2c implementer handoff.
