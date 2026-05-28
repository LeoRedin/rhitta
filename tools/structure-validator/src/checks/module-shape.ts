import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

const REQUIRED_SUBFOLDERS = ['domain', 'application', 'infra', 'http']

export const checkModuleShape: Check = ({ repoRoot }) => {
  const failures: Failure[] = []
  const modulesRoot = join(repoRoot, 'apps', 'api', 'src', 'modules')

  if (!existsSync(modulesRoot) || !statSync(modulesRoot).isDirectory()) {
    // apps/api or modules/ doesn't exist yet — vacuous pass.
    return failures
  }

  const features = readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !entry.name.startsWith('.'))

  for (const feature of features) {
    const featurePath = join(modulesRoot, feature.name)
    const relativeBase = `apps/api/src/modules/${feature.name}`

    // 1. module.ts must exist
    if (!existsSync(join(featurePath, 'module.ts'))) {
      failures.push({
        path: `${relativeBase}/module.ts`,
        reason: 'feature module must export a module.ts (registerXModule + lazy singleton)',
        adrRef: 'ADR-0003',
      })
    }

    // 2. All four subfolders must exist and be non-empty
    for (const sub of REQUIRED_SUBFOLDERS) {
      const subPath = join(featurePath, sub)
      if (!existsSync(subPath) || !statSync(subPath).isDirectory()) {
        failures.push({
          path: `${relativeBase}/${sub}/`,
          reason: `feature module must contain ${sub}/ subfolder`,
          adrRef: 'ADR-0003',
        })
        continue
      }

      const entries = readdirSync(subPath)
      if (entries.length === 0) {
        failures.push({
          path: `${relativeBase}/${sub}/`,
          reason: `${sub}/ must contain at least one file (.gitkeep is acceptable)`,
          adrRef: 'ADR-0003',
        })
      }
    }
  }

  return failures
}
