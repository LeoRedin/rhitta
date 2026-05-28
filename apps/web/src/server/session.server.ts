// =============================================================================
// session.ts — server-side session resolver for SSR.
// =============================================================================
//
// Per ADR-0019, auth-gated routes resolve the Better Auth session
// server-side (in `beforeLoad`) so the HTML never flashes unauthenticated
// content. This helper bridges Better Auth's `getSession()` with the
// inbound request's cookie context provided by TanStack Start.
//
// Why this exists
// ---------------
// Better Auth's `authClient.getSession()` works isomorphically:
//   - In the browser, it issues a `fetch` against the configured `baseURL`,
//     and the browser attaches `document.cookie` automatically (because we
//     enabled credentials in Better Auth's default fetch config).
//   - On the server, there is no ambient cookie jar. The Node fetch we
//     trigger has to be told explicitly what cookies to send — otherwise
//     Better Auth's API returns an unauthenticated response and every SSR
//     render thinks the user is signed out, even when they hold a valid
//     session.
//
// TanStack Start request context
// ------------------------------
// `@tanstack/react-start/server` re-exports `@tanstack/start-server-core`,
// which provides per-request accessors that work inside any handler /
// `beforeLoad` running in the SSR call stack:
//   - `getRequestHeader(name)` — typed accessor for a single inbound header.
//   - `getRequestHeaders(): TypedHeaders<RequestHeaderMap>` — full bag.
//   - `getCookie(name)` / `getCookies()` — convenience cookie parsers.
//
// We forward the raw `cookie` header from the inbound request so Better
// Auth's server-side cookie parser (which expects the same wire format
// the browser would send) sees the session cookie unchanged. The header
// forwarding is wired through Better Auth's `fetchOptions.headers`
// escape hatch.
//
// Server-only boundary
// --------------------
// This module imports `@tanstack/react-start/server`, which only resolves
// inside the SSR bundle. Importing it from a client-only module will
// fail at build time. Callers (route `beforeLoad`s) are responsible for
// running only on the SSR pass, which TanStack Start guarantees.
// =============================================================================

import { getRequestHeader } from '@tanstack/react-start/server'
import { authClient } from '../lib/auth/client.js'

/**
 * Resolve the current Better Auth session from the inbound request's
 * cookies. Returns Better Auth's `{ data, error }` envelope; the caller
 * checks `data?.user` to decide whether to redirect.
 *
 * Safe to call from a route's `beforeLoad` on the SSR pass. Do NOT call
 * from a component render path — use the `useSession()` hook there.
 */
export async function getServerSession() {
  const cookie = getRequestHeader('cookie') ?? ''

  return authClient.getSession({
    fetchOptions: {
      headers: cookie ? { cookie } : {},
    },
  })
}
