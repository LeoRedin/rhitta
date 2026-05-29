# @rhitta/web

The Rhitta web client — a [TanStack Start](https://tanstack.com/start) **SSR** app consuming the `@rhitta/api` Encore service.

## Run locally

Start the API first (`pnpm dev:api`), then:

```bash
pnpm dev:web          # from the repo root — or: pnpm --filter @rhitta/web dev (Vite)
pnpm --filter @rhitta/web start       # serve the production build
```

`.env` is pre-created from `.env.example` (gitignored) with `VITE_API_URL`/`VITE_BETTER_AUTH_URL` pointing at the local API (`http://localhost:4000`). Vite loads it automatically.

## Architecture

- **SSR-first** — the route tree resolves on the Node server before HTML ships, so auth-gated routes never flash unauthenticated content ([ADR-0019](../../docs/adr/0019-ssr-first-web-app.md)).
- **API access only through the Encore-generated client** at `src/lib/api-client/` — no raw `fetch()` to the API ([ADR-0020](../../docs/adr/0020-encore-generated-api-client.md)). Regenerate with `pnpm --filter @rhitta/web gen:api-client`.
- **Single auth gate** at `src/routes/_authenticated/route.tsx` (`beforeLoad` reads the Better Auth session) — pages never check auth themselves.
- **Realtime only via the hook factory** `src/lib/realtime/use-realtime-subscription.ts` — components never touch raw transports ([ADR-0021](../../docs/adr/0021-centralized-realtime-hook-factory.md)).

```
src/
  routes/      file-based routes (incl. _authenticated/ gate + reference Notes pages)
  components/  app components
  lib/         api-client, realtime, theme, query, forms
  server/      server-only entry bits
  styles/      Tailwind v4 entry
```

## State, forms, styling

- Server state: **TanStack Query**. UI state: **Zustand** (theme, toasts). Never mirror server state into client state.
- Forms: **TanStack Form** via the `createZodForm` factory, schemas from `@rhitta/contracts`.
- Design system: `@rhitta/design-system-web` (Radix Primitives + Tailwind v4 + `@rhitta/design-tokens` semantic vars — [ADR-0022](../../docs/adr/0022-radix-primitives-design-system-web.md)).

## Test

```bash
pnpm --filter @rhitta/web test        # Vitest + Testing Library
```

## Environment

Copy `.env.example`. The dev server proxies to the local Encore API; see `src/lib/api-client/`.
