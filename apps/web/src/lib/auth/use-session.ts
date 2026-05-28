// =============================================================================
// use-session.ts — re-export of Better Auth's reactive session hook.
// =============================================================================
//
// `authClient.useSession` from Better Auth 1.6.11's React client already
// matches the shape downstream callers (route `beforeLoad`, header avatar,
// etc.) expect:
//
//   { data: Session | null, isPending, isRefetching, error, refetch }
//
// We re-export it from this dedicated module so consumers can
//
//   import { useSession } from '~/lib/auth/use-session'
//
// without importing the full client surface, and so a future wrapper
// (toast on error, telemetry, etc.) can be slotted in without touching
// every call site.
// =============================================================================

export { useSession } from './client.js'
