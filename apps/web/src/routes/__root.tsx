// =============================================================================
// __root.tsx — root layout for the TanStack Start app.
// =============================================================================
//
// Provides the SSR HTML shell (`<html><head>...</head><body>...</body></html>`)
// and the React provider stack that every route inherits:
//
//   1. `<ThemeScript />` — synchronous inline script in `<head>` that reads
//      the persisted theme mode from `localStorage` and sets
//      `data-theme="..."` on `<html>` before React boots. Prevents FOUC on
//      hard reloads when the user has chosen a non-default theme.
//   2. `<QueryClientProvider>` — wraps the entire route tree so any route
//      component / hook can use TanStack Query. The `QueryClient` is built
//      once per request inside `getRouter()` (see `src/router.tsx`) and
//      handed to the root route via the typed router context (declared in
//      `src/router.tsx` as `RouterContext.queryClient`).
//   3. `<ToastHost />` — renders the global Radix Toast viewport so any
//      hook / handler can call `useToastQueue().push(...)` and have the
//      result rendered, regardless of which route is active.
//   4. `<HeadContent />` / `<Scripts />` — TanStack Start's machinery for
//      streaming per-route `<head>` tags into `<head>` and the hydration
//      bundle into `<body>`. Without `<Scripts />` the client never
//      hydrates.
//
// Router context shape
// --------------------
// `createRootRouteWithContext<RouterContext>()(...)` declares that every
// downstream `beforeLoad` / `loader` receives a `RouterContext` argument
// with `{ queryClient, getSession }`. The type is defined in
// `src/router.tsx` (single source of truth); this file consumes it.
//
// See ADR-0019 (SSR-first) and AGENTS.md rule 10 (single auth gate).
// =============================================================================

import { QueryClientProvider } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ToastHost } from '../components/toast-host.js'
import { ThemeScript } from '../lib/theme/index.js'
import type { RouterContext } from '../router.js'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Rhitta' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <ToastHost />
        <Outlet />
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <ThemeScript />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
