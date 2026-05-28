// =============================================================================
// router.tsx — TanStack Start router entry.
// =============================================================================
//
// TanStack Start's Vite plugin auto-resolves `src/router.{ts,tsx}` as the
// router entry (see `@tanstack/start-plugin-core/src/planning.ts`,
// `defaultEntry: 'router'`). The expected export shape is a synchronous
// `getRouter()` factory — Start calls it once per SSR request and once on
// the client to construct a fresh `Router` instance with per-request
// providers (QueryClient, auth resolver, ...).
//
// Router context
// --------------
// `RouterContext` is the typed argument every `beforeLoad` / `loader`
// receives. Two members:
//
//   - `queryClient` — a fresh `QueryClient` per SSR request (so concurrent
//     requests cannot share cache entries), constructed via the wrapper
//     factory in `~/lib/queries/client.ts`. The same instance is handed
//     to `<QueryClientProvider>` in `__root.tsx`, so loaders that prefetch
//     with `queryClient.ensureQueryData` populate the same cache the
//     hydrated client mounts (ADR-0019 SSR-first).
//
//   - `getSession` — a function that returns the current Better Auth
//     session. On the server it forwards the inbound `cookie` header to
//     Better Auth so SSR sees the authenticated user (see
//     `~/server/session.server.ts`); on the client it delegates to
//     `authClient.getSession()` which uses the browser's cookie jar. Both
//     branches return the same `{ data, error }` envelope. The single
//     auth gate (`_authenticated/route.tsx`, AGENTS.md rule 10) calls
//     this in its `beforeLoad` and redirects unauthenticated users.
//
// Module augmentation registers the constructed router with TanStack
// Router so `<Link to="...">`, `useNavigate()`, etc. infer routes from
// `routeTree.gen.ts`.
//
// Server / client branch for `getSession`
// ---------------------------------------
// TanStack Start enforces environment boundaries through its
// import-protection plugin: files matching `**/*.server.*` cannot be
// imported from client modules even via dynamic `import()`, because the
// graph is inspected at build time. The supported escape hatch is
// `createIsomorphicFn()` from `@tanstack/react-start` — the Start
// compiler rewrites the chain so the client bundle ships only the
// `.client(...)` implementation and the server bundle only the
// `.server(...)` implementation. We use it to compose `getSession`:
// the client variant calls `authClient.getSession()` (which uses
// `document.cookie`); the server variant calls into
// `~/server/session.server.ts`, which is the only module allowed to
// import `@tanstack/react-start/server` for cookie forwarding.
// =============================================================================

import { createRouter } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { authClient } from './lib/auth/index.js'
import { createQueryClient } from './lib/queries/index.js'
import { routeTree } from './routeTree.gen.js'
import { getServerSession } from './server/session.server.js'

type AuthClient = typeof authClient
type SessionResult = Awaited<ReturnType<AuthClient['getSession']>>

/**
 * Router context handed to every `beforeLoad` / `loader`.
 *
 * Components consume this via `Route.useRouteContext()`.
 */
export type RouterContext = {
  queryClient: ReturnType<typeof createQueryClient>
  getSession: () => Promise<SessionResult>
}

/**
 * Environment-aware session resolver.
 *
 * `createIsomorphicFn` lets the Start compiler erase the wrong branch
 * per environment: the client bundle never sees the server module's
 * `@tanstack/react-start/server` import, and the server bundle never
 * sees the client-side `authClient.getSession()` shortcut.
 */
const resolveSession = createIsomorphicFn()
  .server((): Promise<SessionResult> => getServerSession())
  .client((): Promise<SessionResult> => authClient.getSession())

/**
 * TanStack Start router factory.
 *
 * Called once per SSR request by Start's server bundle and once on the
 * client during hydration. Builds a fresh `QueryClient` per call so
 * concurrent SSR requests never share cache entries.
 */
export function getRouter() {
  const queryClient = createQueryClient()

  const context: RouterContext = {
    queryClient,
    getSession: resolveSession,
  }

  return createRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
    defaultStaleTime: 30_000,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
