/**
 * Mounts Better Auth's HTTP handler at `/auth/*` via an Encore raw
 * endpoint.
 *
 * Encore's raw endpoint signature (per
 * `encore.dev/api/mod.d.ts`) is the Node-native
 * `(req: IncomingMessage, res: ServerResponse) => void`. Better Auth
 * ships a matching adapter — `toNodeHandler` from
 * `better-auth/node` — that wraps its Fetch-style `(Request) => Response`
 * handler so it can be invoked with Node req/res pairs.
 *
 * Path notes
 * ----------
 * The wildcard segment uses Encore's named-wildcard syntax
 * (`*action`). Better Auth dispatches against the full URL pathname so
 * we don't need to thread the captured segment through manually — we
 * just hand it the request and it routes internally.
 *
 * Method `'*'` makes Encore accept any verb (GET, POST, etc.); Better
 * Auth's handler does its own method dispatch per endpoint.
 *
 * `expose: true` puts the handler on the public-facing network so
 * browsers can hit `/auth/sign-in/magic-link`, `/auth/get-session`, etc.
 */

import { toNodeHandler } from 'better-auth/node'
import { api } from 'encore.dev/api'
import { auth } from '../infra/better-auth-adapter.js'

const handler = toNodeHandler(auth.handler)

export const authHandler = api.raw(
  { method: '*', path: '/auth/*action', expose: true },
  async (req, res) => {
    await handler(req, res)
  }
)
