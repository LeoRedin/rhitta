import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

const PACKAGE_PARENTS = ['apps', 'packages']

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

export const checkWorkspaceName: Check = ({ repoRoot }) => {
  const failures: Failure[] = []

  for (const parent of PACKAGE_PARENTS) {
    const parentAbs = join(repoRoot, parent)
    if (!isDir(parentAbs)) continue

    const entries = readdirSync(parentAbs, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue

      const pkgJsonPath = join(parentAbs, entry.name, 'package.json')
      if (!isFile(pkgJsonPath)) {
        failures.push({
          path: `${parent}/${entry.name}/package.json`,
          reason: 'workspace package missing package.json',
        })
        continue
      }

      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as { name?: unknown }
        const name = typeof pkg.name === 'string' ? pkg.name : ''
        if (!name.startsWith('@rhitta/')) {
          failures.push({
            path: `${parent}/${entry.name}/package.json`,
            reason: `package name "${name}" must be scoped under @rhitta/*`,
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failures.push({
          path: `${parent}/${entry.name}/package.json`,
          reason: `invalid JSON: ${msg}`,
        })
      }
    }
  }

  return failures
}
