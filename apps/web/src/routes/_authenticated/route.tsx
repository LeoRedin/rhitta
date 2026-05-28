// =============================================================================
// /_authenticated — the single auth gate (AGENTS.md rule 10).
// =============================================================================
//
// TanStack Router's `_` prefix marks a "pathless layout route" — the URL
// shape stays clean (`/notes`, `/agent`), but every child route inherits
// this layout AND this `beforeLoad`. That makes this file the one and
// only auth check for protected routes in apps/web. Adding a second
// `beforeLoad` session check anywhere else is a violation of rule 10.
//
// Flow
// ----
// 1. `beforeLoad` calls `context.getSession()` — see `src/router.tsx` for
//    the SSR/client branching.
// 2. If the session lacks a `user`, throw a `redirect()` to
//    `/auth/sign-in`, stashing the original pathname in the `redirect`
//    search param so the sign-in page can return the user to their
//    target after authentication.
// 3. Otherwise return `{ user }` — child routes (and components inside
//    `<Outlet />`) consume it via `Route.useRouteContext()`.
//
// Layout
// ------
// Wraps every authenticated route in the global `<Nav />` (theme toggle,
// sign-out) plus a content `<main>` container. Designed so route
// components only need to render their feature surface.
// =============================================================================

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Nav } from '../../components/nav.js'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.getSession()
    if (!session?.data?.user) {
      throw redirect({
        to: '/auth/sign-in',
        search: { redirect: location.pathname },
      })
    }
    return { user: session.data.user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-app">
      <Nav />
      <main className="container mx-auto flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
