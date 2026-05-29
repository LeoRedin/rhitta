import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

function checkWebRouteConvention(repoRoot: string, failures: Failure[]) {
  const routesRoot = join(repoRoot, 'apps', 'web', 'src', 'routes')

  // Vacuous pass: apps/web/src/routes/ doesn't exist yet (earlier-phase branches)
  if (!existsSync(routesRoot)) {
    return
  }

  const authGatePath = join(routesRoot, '_authenticated', 'route.tsx')

  // The single auth gate must exist
  if (!existsSync(authGatePath)) {
    failures.push({
      path: 'apps/web/src/routes/_authenticated/route.tsx',
      reason:
        'missing single auth gate — _authenticated/route.tsx must exist with a beforeLoad hook',
      adrRef: 'AGENTS.md#10',
    })
    return
  }

  // Text-match for beforeLoad in file body
  const body = readFileSync(authGatePath, 'utf-8')
  if (!body.includes('beforeLoad')) {
    failures.push({
      path: 'apps/web/src/routes/_authenticated/route.tsx',
      reason:
        '_authenticated/route.tsx must export a beforeLoad hook (single auth gate per AGENTS.md rule 10)',
      adrRef: 'AGENTS.md#10',
    })
  }
}

function checkMobileRouteConvention(repoRoot: string, failures: Failure[]) {
  const mobileAppRoot = join(repoRoot, 'apps', 'mobile', 'app')

  // Vacuous pass: apps/mobile/app/ doesn't exist yet (earlier-phase branches)
  if (!existsSync(mobileAppRoot)) {
    return
  }

  const authGatePath = join(mobileAppRoot, '_authenticated', '_layout.tsx')

  // The single auth gate must exist
  if (!existsSync(authGatePath)) {
    failures.push({
      path: 'apps/mobile/app/_authenticated/_layout.tsx',
      reason:
        'missing single auth gate — _authenticated/_layout.tsx must exist with useSession hook',
      adrRef: 'ADR-0023',
    })
    return
  }

  // Text-match for useSession in file body
  const body = readFileSync(authGatePath, 'utf-8')
  if (!body.includes('useSession')) {
    failures.push({
      path: 'apps/mobile/app/_authenticated/_layout.tsx',
      reason: '_authenticated/_layout.tsx must useSession hook (single auth gate per ADR-0023)',
      adrRef: 'ADR-0023',
    })
  }
}

export const checkRouteConventions: Check = ({ repoRoot }) => {
  const failures: Failure[] = []

  checkWebRouteConvention(repoRoot, failures)
  checkMobileRouteConvention(repoRoot, failures)

  return failures
}
