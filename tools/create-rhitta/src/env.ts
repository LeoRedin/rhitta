/**
 * Produce a ready-to-use `.env` body from a committed `.env.example`, filling in
 * the dev-time `BETTER_AUTH_SECRET` with a generated value. Examples without that
 * line (e.g. the web app's) pass through unchanged.
 */
export function fillEnvFromExample(example: string, betterAuthSecret: string): string {
  return example.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${betterAuthSecret}`)
}
