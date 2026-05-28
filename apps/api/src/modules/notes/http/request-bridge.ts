/**
 * Bridge between Encore's runtime request metadata and the Fetch-style
 * `Request` our `AuthGate` consumes.
 *
 * `BetterAuthGate.getCurrentUser(req: Request)` calls
 * `auth.api.getSession({ headers: req.headers })`, so all we really need
 * is a `Request` whose `.headers` mirror the incoming HTTP request.
 * Everything else (method, body, URL) is irrelevant to session lookup —
 * Better Auth only reads the `cookie` / `authorization` headers.
 *
 * Going through this seam (rather than passing `Headers` directly) keeps
 * the `AuthGate` port unchanged across the auth module's existing
 * BetterAuthGate tests and the new HTTP handler tests.
 */
import type { APICallMeta, PubSubMessageMeta, RequestMeta } from 'encore.dev'

/**
 * Build a synthetic `Request` from Encore's `RequestMeta`. Only the
 * headers are populated — Better Auth's session lookup is the only
 * consumer.
 *
 * If `meta` is undefined or is a Pub/Sub message (rather than an API
 * call), the returned `Request` has empty headers; `AuthGate` will then
 * throw `UnauthorizedError`, which `mapError` translates into 401.
 */
export function requestFromMeta(meta: RequestMeta | undefined): Request {
  const headers = new Headers()
  if (meta && isApiCall(meta)) {
    for (const [key, value] of Object.entries(meta.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v)
      } else {
        headers.set(key, value)
      }
    }
  }
  return new Request('http://internal.local/', { headers })
}

function isApiCall(meta: APICallMeta | PubSubMessageMeta): meta is APICallMeta {
  return meta.type === 'api-call'
}
