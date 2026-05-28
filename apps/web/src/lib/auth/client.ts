// =============================================================================
// client.ts — Better Auth React client for apps/web.
// =============================================================================
//
// Per the web-app biome variant (ADR-0021), `better-auth/*` imports are
// permitted only inside `src/lib/auth/**`. This module owns the constructed
// `authClient` and re-exports the hooks/actions that the rest of the app
// consumes via `~/lib/auth`.
//
// Configuration:
//   - `baseURL` points at the Better Auth handler mounted by apps/api
//     (Phase 2a) at the `VITE_BETTER_AUTH_URL` origin. Vite substitutes
//     `import.meta.env.VITE_BETTER_AUTH_URL` at build time, so both the
//     SSR pass and the hydrated browser use the same value.
//   - Plugins: only `magicLinkClient()` for v0 (Task scope explicitly
//     excludes OAuth providers). Email/password sign-in is part of Better
//     Auth's core surface and needs no plugin.
//
// Verified against `better-auth@1.6.11`:
//   - `createAuthClient` from `better-auth/react` returns an object with
//     `signIn`, `signUp`, `signOut`, `useSession`, plus plugin-contributed
//     actions (`signIn.magicLink`, `magicLink.verify`).
//   - All actions return `{ data, error }` shaped responses from
//     `@better-fetch/fetch`.
//   - `useSession` returns `{ data, isPending, isRefetching, error, refetch }`.
// =============================================================================

import { magicLinkClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
const baseURL = env?.VITE_BETTER_AUTH_URL ?? 'http://localhost:4000'

export const authClient = createAuthClient({
  baseURL,
  plugins: [magicLinkClient()],
})

export const { useSession, signIn, signUp, signOut, getSession } = authClient
