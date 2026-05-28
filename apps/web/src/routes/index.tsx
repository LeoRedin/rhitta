// =============================================================================
// / — public landing page.
// =============================================================================
//
// Pre-auth surface. Renders a sign-in CTA. The single auth gate lives at
// `_authenticated/route.tsx` (AGENTS.md rule 10) — this route does not
// inspect or redirect on session state to keep the gate centralised.
// Authenticated users can still navigate from here; the nav surfaces in
// the authenticated layout instead.
// =============================================================================

import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="text-4xl font-bold text-text-body">Rhitta</h1>
        <p className="mt-2 text-lg text-text-muted">
          The opinionated boilerplate for agentic-AI-first product teams.
        </p>
      </div>
      <Link
        to="/auth/sign-in"
        className="inline-flex h-12 w-fit items-center justify-center rounded-md bg-brand-primary px-6 text-base font-medium text-text-inverse hover:opacity-90"
      >
        Sign in
      </Link>
    </main>
  )
}
