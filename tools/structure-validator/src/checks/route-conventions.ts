import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

export const checkRouteConventions: Check = ({ repoRoot }) => {
  const failures: Failure[] = []

  const routesRoot = join(repoRoot, 'apps', 'web', 'src', 'routes')

  // Vacuous pass: apps/web/src/routes/ doesn't exist yet (earlier-phase branches)
  if (!existsSync(routesRoot)) {
    return failures
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
    return failures
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

  return failures
}
