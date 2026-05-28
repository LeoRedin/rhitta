import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

const WORKSPACE_PARENTS = ['apps', 'packages', 'tools']

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

function adrFor(wsRel: string): string | undefined {
  if (wsRel.startsWith('packages/design-system-')) return 'ADR-0006'
  return 'ADR-0003'
}

export const checkPackageNaming: Check = ({ repoRoot }) => {
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
      if (!isFile(pkgJsonPath)) continue

      let pkg: { name?: unknown }
      try {
        pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as { name?: unknown }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failures.push({
          path: `${wsRel}/package.json`,
          reason: `invalid JSON: ${msg}`,
          adrRef: adrFor(wsRel),
        })
        continue
      }

      const name = typeof pkg.name === 'string' ? pkg.name : ''
      const expected = `@rhitta/${entry.name}`
      if (name !== expected) {
        failures.push({
          path: `${wsRel}/package.json`,
          reason: `package name "${name}" must equal "${expected}" (matches folder)`,
          adrRef: adrFor(wsRel),
        })
      }
    }
  }

  return failures
}
