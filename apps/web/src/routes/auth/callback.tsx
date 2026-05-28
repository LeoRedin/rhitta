// =============================================================================
// /auth/callback — thin client-side landing for post-auth redirects.
// =============================================================================
//
// Better Auth's magic-link verification handler lives on the API side at
// `/magic-link/verify` (apps/api, Phase 2a). When the user clicks the
// link in their email, the API verifies the token, sets the session
// cookie, and 302s to `callbackURL`. In the common case that
// `callbackURL` points directly at the desired in-app destination, this
// route is never reached.
//
// We still ship it as a documented landing spot for two scenarios:
//   1. Future OAuth flows (not enabled in this task) that round-trip
//      through a generic `/auth/callback` before settling on the final
//      page — keeps the URL shape stable when those land.
//   2. A defensive fallback if the API redirects here with a `?redirect=`
//      query param indicating where the user was originally headed.
//
// Today the route is a pure redirect — no UI, no session lookup. The
// session is already established (cookie was set by the API); we just
// move the user to their destination.
// =============================================================================

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/callback')({
  beforeLoad: ({ search }) => {
    const target = (search as { redirect?: string }).redirect ?? '/'
    throw redirect({ to: target })
  },
})
