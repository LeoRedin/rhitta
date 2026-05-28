import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

const WORKSPACE_PARENTS = ['apps', 'packages', 'tools']

// `null` means: the workspace is expected to have NO tsconfig.json
// (pure JSON-config packages like @rhitta/tsconfig and @rhitta/biome-config).
const TSCONFIG_VARIANT_MAP: Record<string, string | null> = {
  'tools/structure-validator': '@rhitta/tsconfig/node.json',
  'apps/api': '@rhitta/tsconfig/node.json',
  'apps/web': '@rhitta/tsconfig/web.json',
  'apps/mobile': '@rhitta/tsconfig/mobile.json',
  'packages/tsconfig': null,
  'packages/biome-config': null,
  'packages/design-tokens': '@rhitta/tsconfig/node.json',
  'packages/contracts': '@rhitta/tsconfig/base.json',
  'packages/design-system-web': '@rhitta/tsconfig/web.json',
  'packages/design-system-mobile': '@rhitta/tsconfig/mobile.json',
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

function stripJsonComments(src: string): string {
  // Strip /* */ block comments and // line comments — not perfect, but enough
  // for our hand-authored tsconfig.json files which don't contain strings
  // that resemble comment markers.
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"])\/\/.*$/gm, '$1')
}

function readExtends(file: string): string | string[] | undefined {
  const raw = readFileSync(file, 'utf-8')
  const parsed = JSON.parse(stripJsonComments(raw)) as { extends?: unknown }
  const ext = parsed.extends
  if (typeof ext === 'string') return ext
  if (Array.isArray(ext) && ext.every((e) => typeof e === 'string')) {
    return ext as string[]
  }
  return undefined
}

function firstExtendsString(ext: string | string[] | undefined): string | undefined {
  if (ext === undefined) return undefined
  if (typeof ext === 'string') return ext
  return ext[0]
}

export const checkTsconfigInheritance: Check = ({ repoRoot }) => {
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

      // Only consider real workspaces (have package.json)
      if (!isFile(join(wsAbs, 'package.json'))) continue

      const tsconfigPath = join(wsAbs, 'tsconfig.json')
      const mapped = TSCONFIG_VARIANT_MAP[wsRel]

      if (!(wsRel in TSCONFIG_VARIANT_MAP)) {
        failures.push({
          path: `${wsRel}/tsconfig.json`,
          reason:
            'no mapping for this workspace; add to TSCONFIG_VARIANT_MAP in tools/structure-validator/src/checks/tsconfig-inheritance.ts',
          adrRef: 'ADR-0014',
        })
        continue
      }

      if (mapped === null) {
        // Expected to have no tsconfig.json.
        if (existsSync(tsconfigPath)) {
          failures.push({
            path: `${wsRel}/tsconfig.json`,
            reason: 'workspace mapped as JSON-config package (null) but has a tsconfig.json',
            adrRef: 'ADR-0014',
          })
        }
        continue
      }

      if (!isFile(tsconfigPath)) {
        failures.push({
          path: `${wsRel}/tsconfig.json`,
          reason: 'workspace missing tsconfig.json',
          adrRef: 'ADR-0014',
        })
        continue
      }

      let extendsValue: string | string[] | undefined
      try {
        extendsValue = readExtends(tsconfigPath)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failures.push({
          path: `${wsRel}/tsconfig.json`,
          reason: `invalid JSON: ${msg}`,
          adrRef: 'ADR-0014',
        })
        continue
      }

      const actual = firstExtendsString(extendsValue)
      if (actual !== mapped) {
        failures.push({
          path: `${wsRel}/tsconfig.json`,
          reason: `extends "${actual ?? '<missing>'}", expected "${mapped}"`,
          adrRef: 'ADR-0014',
        })
      }
    }
  }

  return failures
}
