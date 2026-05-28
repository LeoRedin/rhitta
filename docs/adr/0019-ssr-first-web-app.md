# ADR 0019: SSR-first web app (TanStack Start)

## Status
Accepted

## Context
TanStack Start (ADR-0009 references its selection inside the locked stack) supports two render modes:

- **SSR (server-side render)** — the route tree resolves on the Node server; rendered HTML ships to the browser with hydration data inlined. Auth-gated routes can verify the session before rendering.
- **SPA (single-page application)** — the browser fetches a static shell, runs JS, then renders. Faster local iteration; static-CDN deploy possible.

Rhitta targets **product apps**, not marketing sites. Almost every page is auth-gated. The naive SPA failure mode — render → check auth → flash unauthenticated content → redirect — is something every consumer of this boilerplate will hit, and most will fix incorrectly.

Alternatives considered:
- **SPA-only**: lowest complexity, but the auth flash is unavoidable without paint-blocking JS. Defeats the boilerplate's "best-practices baked in" promise.
- **SSR-only**: higher complexity (hydration discipline, server-side cookie handling, can't deploy to a static CDN), but eliminates the auth-flash class of bug and ships SEO/first-paint wins for free.
- **Per-route mode toggle**: TanStack Start can do this, but it doubles the patterns engineers reason about. Not worth it for v0.

## Decision
`apps/web` ships **SSR-first**. Every route renders server-side by default. The Encore client SDK is constructed with the request cookies on the server, the Better Auth session is resolved there, and `_authenticated/route.tsx`'s `beforeLoad` either passes the session through to children or returns a redirect — all before HTML hits the wire.

Client-only behavior (modals, transient UI state) lives in `useEffect` and Zustand slices that hydrate after first paint. Server state goes through TanStack Query with `dehydrate()` / `HydrationBoundary` so the server pre-fills the cache.

Deploy target: Node server (matches the API's deploy target per ADR-0009). Static CDN is not a supported deploy.

## Consequences
- Auth-gated routes never flash unauthenticated content; the redirect happens server-side before HTML.
- SEO and first-paint metrics improve "for free" — consumers don't have to opt in.
- TanStack Query's server-side `prefetchQuery` integration is wired in the boilerplate — pages render with data already in cache.
- **Cost: hydration discipline.** Engineers must avoid client-only globals (`window`, `document`) at module load and at first render. The boilerplate's reference pages model this correctly.
- **Cost: deploy options narrow.** Vercel/Fly/Railway/self-hosted Node all work; static-only hosts (Cloudflare Pages plain, GitHub Pages) don't.
- **Cost: dev-server iteration is slightly slower** than SPA because each route re-renders on the server. Acceptable.
- Per-route SPA override remains possible if a future page genuinely needs it — documented in a follow-up if/when it arises.
