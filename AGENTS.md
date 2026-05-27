# AGENTS.md — The Rhitta Operating Manual

**Read this first. Re-read it whenever you're unsure.** It is the canonical source of truth for how to work in this repo. Conventions here override your training defaults.

---

## 1. What Rhitta is

Rhitta is an opinionated monorepo boilerplate for shipping production-quality API + web + mobile apps. Its defining trait: **machine-enforced conventions that make architectural deviation visibly wrong, especially for AI agents writing code.** The stack is locked, the structure is locked, the patterns are locked. You rise to meet the standard — you do not negotiate it.

If a request implies deviating from these rules, stop and surface the conflict. Do not invent new patterns.

---

## 2. Non-negotiable rules

1. **One way to do everything.** If a pattern already exists for a problem, use it. Do not introduce alternatives. Deviation requires an ADR.
2. **Follow the folder structure exactly.** New code goes where the convention says it goes — never elsewhere "just for now."
3. **Database access through repos only.** No direct DB client (`pg`, `postgres`, drivers, Supabase admin) outside `infra/postgres-*-repository.ts` files. Enforced by the structure validator and Biome rules.
4. **Validation through Zod only.** All schemas live in `@rhitta/contracts`. No AJV, no class-validator, no native framework schemas, no hand-rolled `typeof` chains at the boundary.
5. **External services through adapters.** Auth, email, payments, storage, analytics, notifications, AI providers — each hits the app through a typed port. No SDK imports inside route handlers or use-cases.
6. **Typed domain errors, mapped centrally.** Throw a domain error class. The central error handler maps it to HTTP status once. Do not write per-handler `try/catch` that maps to status codes.
7. **Forms via TanStack Form only.** Both web and mobile. No Formik, no react-hook-form, no hand-rolled `useState` form goo.
8. **State boundaries.** Server state: TanStack Query. UI state: Zustand. Never mirror server state into client state.
9. **Realtime via the centralized hook factory.** Components do not subscribe to raw transports.
10. **Auth gate in one place per platform.** Never scatter auth checks across middleware + layout + per-page.
11. **No `as any`, no `@ts-expect-error`, no `@ts-ignore`** unless paired with a ticket reference in the comment. Strict TypeScript is non-negotiable.
12. **Conventional Commits required.** `feat(scope): subject`. Lint enforced.
13. **Run `pnpm validate` before pushing.** Lint, typecheck, and structure validation must pass.
14. **Hexagonal architecture.** Every external concern is a port. Default adapters ship; swapping providers means a new adapter, never restructuring the app.
15. **Module DI pattern.** Each feature is a self-contained module under `apps/api/src/modules/<feature>/` with `domain/`, `application/`, `infra/`, `http/`. Composition happens through `composeRoot` / `registerXModule`.

---

## 3. Where to put things

Decision tree for "I need to add X":

| Need | Goes to |
|------|---------|
| New API endpoint | `apps/api/src/modules/<feature>/http/` |
| New domain rule | `apps/api/src/modules/<feature>/domain/` |
| New use-case | `apps/api/src/modules/<feature>/application/` |
| New repository / external adapter | `apps/api/src/modules/<feature>/infra/` |
| New shared type or schema | `packages/contracts/src/<domain>/` |
| New design primitive (web) | `packages/design-system-web/src/primitives/` |
| New design primitive (mobile) | `packages/design-system-mobile/src/primitives/` |
| New theme token | `packages/design-tokens/src/` |
| New architectural decision | `docs/adr/NNNN-<slug>.md` (next free number) |
| New lint/structure rule | `tools/structure-validator/src/` or `packages/biome-config/` |
| One-off script | `tools/<name>/` (never in app code) |

If the table above does not cover what you need, **stop**. Write an ADR, get alignment, then proceed.

---

## 4. Commands

```bash
pnpm install           # install workspace deps
pnpm typecheck         # type-check every workspace
pnpm lint              # Biome lint + format check
pnpm format            # Biome auto-format
pnpm validate          # lint + per-package validate + structure validate
pnpm structure:validate # structure validator only
pnpm changeset         # author a changeset
```

Pre-commit hooks run Biome, typecheck, and the structure validator automatically. Pre-push runs the full validate. Do not skip hooks (`--no-verify`).

---

## 5. Phase status

Rhitta is **alpha, in active development.** Current phase: **Phase 0 — skeleton only.**

- Apps (`apps/api`, `apps/web`, `apps/mobile`) do **not** exist yet — they arrive in Phase 2.
- Shared packages (`@rhitta/tsconfig`, `@rhitta/biome-config`, `@rhitta/design-tokens`, `@rhitta/contracts`, `@rhitta/design-system-*`) do **not** exist yet — they arrive in Phase 1.
- The `create-rhitta` CLI and code generators arrive in Phase 3.

Until Phase 1 lands, **do not invent shared packages or apps** on your own. If a request requires them, stop and surface the gap.

---

## 6. When in doubt

1. Read the relevant ADR in `docs/adr/`.
2. Re-read this document.
3. Ask the human. Do not invent new patterns to fill gaps.

The cost of asking is small. The cost of seeding a divergent pattern in an opinionated boilerplate is large and durable.
