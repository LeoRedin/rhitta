/**
 * Loads `apps/api/.env` into `process.env` for local development.
 *
 * Encore does not read `.env` files itself, and this service reads config
 * straight from `process.env` (see `composeRoot.ts` + `better-auth-adapter.ts`).
 * This side-effect module bridges the two: imported first by the modules that
 * read env at load time, so a local `.env` populates `process.env` before any
 * adapter is constructed.
 *
 * - Production (Encore deploy): no `.env` file exists, so `config()` is a no-op;
 *   real config comes from Encore secrets / the platform environment.
 * - Tests (Vitest): skipped entirely so suites stay hermetic and never pick up
 *   a developer's local `.env`.
 */
import { config } from 'dotenv'

if (!process.env.VITEST) {
  config()
}
