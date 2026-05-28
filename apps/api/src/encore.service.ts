import { Service } from 'encore.dev/service'
import { composeRoot } from './lib/composeRoot.js'

/**
 * Bootstrap the API service.
 *
 * Encore.ts 1.57.5 has no `Service.init` hook — services are declared,
 * not lifecycle-managed. The canonical place to perform one-time wiring
 * is the top of `encore.service.ts`, which Encore loads exactly once at
 * process startup, before any handler is dispatched.
 *
 * `composeRoot()` reads env, constructs the production adapter graph,
 * and installs it into the per-module singletons HTTP handlers reach for
 * (`authGate()`, `notesModule()`, `agentRunsModule()`).
 *
 * Side-effect imports inside `composeRoot.ts` also drag in the auth
 * raw-endpoint (`/auth/*`) so Encore picks it up via static analysis.
 *
 * NOTE: `composeRoot()` constructs `BetterAuthGate.production()` which
 * touches `lib/db.ts`'s `orm` (a `pg.Pool` over Encore's `SQLDatabase`).
 * `SQLDatabase`'s connection string is wired by Encore's runtime before
 * the JS module graph evaluates, so this ordering is safe in practice.
 * The `orm` constructor just registers a lazy pool — actual connections
 * are deferred until first query.
 */
composeRoot()

export default new Service('api')
