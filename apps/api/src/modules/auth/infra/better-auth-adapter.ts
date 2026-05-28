/**
 * Constructs the singleton Better Auth instance for the API service.
 *
 * Better Auth owns every aspect of authentication flow — sign-up,
 * sign-in, magic-link issuance/consumption, session lifecycle, cookies.
 * The rest of the codebase only ever interacts with it through:
 *
 *   1. The `auth.handler` mounted at `/auth/*` (see
 *      `../http/auth-handler.ts`) — this serves every client-facing
 *      auth request.
 *   2. `auth.api.getSession({ headers })` — used by `BetterAuthGate`
 *      to resolve the principal on protected endpoints.
 *
 * Per ADR-0009, Better Auth is fixed at `better-auth@1.6.11`. The
 * Drizzle adapter is wired against the schema defined in `./schema.ts`
 * (the four canonical Better Auth tables: user, session, account,
 * verification). The migration is `apps/api/src/lib/drizzle/0001_auth_tables.sql`.
 */
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins'
import { orm } from '../../../lib/db.js'
import * as schema from './schema.js'

export const auth = betterAuth({
  database: drizzleAdapter(orm, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // Magic link doubles as email verification, so we don't require
    // a separate verification step on password sign-ups.
    requireEmailVerification: false,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO(Task 8): wire to the Resend email adapter. For now, log
        // so the link is visible in `encore run` output during dev.
        console.log(`[auth] magic link for ${email}: ${url}`)
      },
    }),
  ],
  // OAuth scaffold — disabled by default per task spec. Re-enable by
  // setting GOOGLE_CLIENT_ID/SECRET (or other provider env) and
  // uncommenting the block below.
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  // },
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-replace-in-production',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
})

export type Auth = typeof auth
