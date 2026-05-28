import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

const WORKSPACE_PARENTS = ['apps', 'packages', 'tools']

type PackageJson = {
  name?: unknown
  scripts?: Record<string, unknown>
  files?: unknown
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile()
  } catch {
    return false
  }
}

function dirHasAnyEntry(p: string): boolean {
  try {
    return readdirSync(p).length > 0
  } catch {
    return false
  }
}

export const checkWorkspaceShape: Check = ({ repoRoot }) => {
  const failures: Failure[] = []

  for (const parent of WORKSPACE_PARENTS) {
    const parentAbs = join(repoRoot, parent)
    if (!isDir(parentAbs)) continue

    const entries = readdirSync(parentAbs, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue

      const wsRel = `${parent}/${entry.name}`
      const wsAbs = join(parentAbs, entry.name)

      const pkgJsonPath = join(wsAbs, 'package.json')
      if (!isFile(pkgJsonPath)) {
        // Only enforce shape when this is a workspace (has package.json).
        // Skip non-workspace directories silently.
        continue
      }

      const tsconfigPath = join(wsAbs, 'tsconfig.json')
      const srcDir = join(wsAbs, 'src')

      // Some packages (e.g. @rhitta/tsconfig, @rhitta/biome-config) are
      // pure JSON-config packages with no tsconfig and no src/. Detect that
      // by absence of tsconfig.json AND absence of src/.
      const hasTsconfig = isFile(tsconfigPath)
      const hasSrc = isDir(srcDir)

      if (!hasTsconfig && !hasSrc) {
        // Pure config package; skip shape checks for tsconfig/src/build.
        continue
      }

      if (!hasTsconfig) {
        failures.push({
          path: `${wsRel}/tsconfig.json`,
          reason: 'workspace missing tsconfig.json',
          adrRef: 'ADR-0003',
        })
      }

      if (!hasSrc) {
        failures.push({
          path: `${wsRel}/src`,
          reason: 'workspace missing src/ directory',
          adrRef: 'ADR-0003',
        })
      } else if (!dirHasAnyEntry(srcDir)) {
        failures.push({
          path: `${wsRel}/src`,
          reason: 'workspace src/ directory is empty',
          adrRef: 'ADR-0003',
        })
      }

      let pkg: PackageJson
      try {
        pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as PackageJson
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failures.push({
          path: `${wsRel}/package.json`,
          reason: `invalid JSON: ${msg}`,
        })
        continue
      }

      const hasBuildScript =
        pkg.scripts !== undefined &&
        typeof pkg.scripts === 'object' &&
        pkg.scripts !== null &&
        typeof pkg.scripts.build === 'string'
      const files = Array.isArray(pkg.files) ? pkg.files : []
      const publishesDist = files.includes('dist')

      if (hasBuildScript && publishesDist) {
        const buildTsconfig = join(wsAbs, 'tsconfig.build.json')
        if (!isFile(buildTsconfig)) {
          failures.push({
            path: `${wsRel}/tsconfig.build.json`,
            reason:
              'publishable workspace (scripts.build + files contains "dist") missing tsconfig.build.json',
            adrRef: 'ADR-0003',
          })
        }
      }
    }
  }

  return failures
}
