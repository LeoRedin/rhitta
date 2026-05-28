// =============================================================================
// /home — post-login home page.
// =============================================================================
//
// The first authenticated landing page after sign-in. Reads `user` from
// the router context (populated by the parent `_authenticated/route.tsx`
// `beforeLoad`). Surfaces top-level navigation to the Notes and Agent
// features.
//
// Path choice
// -----------
// `/home` rather than `/` because the public landing already owns `/`
// and TanStack Router's pathless layout convention collapses
// `_authenticated/index.tsx` to `/`, which would conflict. Putting the
// post-login surface at `/home` keeps the public landing intact while
// still letting `_authenticated/route.tsx` own the single auth gate.
//
// Note on link targets
// --------------------
// `/notes` and `/agent` aren't wired up until Tasks 10 and 11 — the
// routeTree generator only knows about routes currently on disk. Until
// those tasks land, the `<Link>`s here point at `/home` itself. The
// typed router will tighten the targets when the routes materialise.
// =============================================================================

import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/home')({
  component: HomePage,
})

function HomePage() {
  const { user } = Route.useRouteContext()
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-text-body">Welcome, {user.name ?? user.email}</h1>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/home"
          className="rounded-md border border-border-default bg-bg-surface px-4 py-2 text-text-body hover:bg-bg-surface-raised"
        >
          Notes
        </Link>
        <Link
          to="/home"
          className="rounded-md border border-border-default bg-bg-surface px-4 py-2 text-text-body hover:bg-bg-surface-raised"
        >
          Agent
        </Link>
      </div>
    </section>
  )
}
