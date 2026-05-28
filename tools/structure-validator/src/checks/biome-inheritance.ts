import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

const WORKSPACE_PARENTS = ['apps', 'packages', 'tools']

const BIOME_VARIANT_MAP: Record<string, string> = {
  'packages/design-tokens': '@rhitta/biome-config/base',
  'packages/contracts': '@rhitta/biome-config/base',
  'packages/design-system-web': '@rhitta/biome-config/react',
  'packages/design-system-mobile': '@rhitta/biome-config/react',
}

const ROOT_EXPECTED = '@rhitta/biome-config/base'

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
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"])\/\/.*$/gm, '$1')
}

function readExtendsArray(file: string): string[] | undefined {
  const raw = readFileSync(file, 'utf-8')
  const parsed = JSON.parse(stripJsonComments(raw)) as { extends?: unknown }
  const ext = parsed.extends
  if (Array.isArray(ext) && ext.every((e) => typeof e === 'string')) {
    return ext as string[]
  }
  if (typeof ext === 'string') return [ext]
  return undefined
}

export const checkBiomeInheritance: Check = ({ repoRoot }) => {
  const failures: Failure[] = []

  // Root biome.json
  const rootBiome = join(repoRoot, 'biome.json')
  if (isFile(rootBiome)) {
    try {
      const ext = readExtendsArray(rootBiome) ?? []
      if (!ext.includes(ROOT_EXPECTED)) {
        failures.push({
          path: 'biome.json',
          reason: `extends ${JSON.stringify(ext)}, expected to include "${ROOT_EXPECTED}"`,
          adrRef: 'ADR-0011',
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({
        path: 'biome.json',
        reason: `invalid JSON: ${msg}`,
        adrRef: 'ADR-0011',
      })
    }
  } else {
    failures.push({
      path: 'biome.json',
      reason: 'root biome.json missing',
      adrRef: 'ADR-0011',
    })
  }

  // Per-workspace biome.json
  for (const parent of WORKSPACE_PARENTS) {
    const parentAbs = join(repoRoot, parent)
    if (!isDir(parentAbs)) continue

    const entries = readdirSync(parentAbs, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue

      const wsRel = `${parent}/${entry.name}`
      const wsAbs = join(parentAbs, entry.name)

      if (!isFile(join(wsAbs, 'package.json'))) continue

      const biomePath = join(wsAbs, 'biome.json')
      const expected = BIOME_VARIANT_MAP[wsRel]

      if (!existsSync(biomePath)) {
        // Workspaces not in the map and without a biome.json are silently skipped.
        // Workspaces in the map MUST have a biome.json.
        if (expected !== undefined) {
          failures.push({
            path: `${wsRel}/biome.json`,
            reason: `workspace expected to have biome.json extending "${expected}"`,
            adrRef: 'ADR-0011',
          })
        }
        continue
      }

      let ext: string[] | undefined
      try {
        ext = readExtendsArray(biomePath)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failures.push({
          path: `${wsRel}/biome.json`,
          reason: `invalid JSON: ${msg}`,
          adrRef: 'ADR-0011',
        })
        continue
      }

      const extArr = ext ?? []
      const includesValid =
        extArr.includes('@rhitta/biome-config/base') ||
        extArr.includes('@rhitta/biome-config/react')

      if (!includesValid) {
        failures.push({
          path: `${wsRel}/biome.json`,
          reason: `extends ${JSON.stringify(extArr)}, expected one of "@rhitta/biome-config/base" or "@rhitta/biome-config/react"`,
          adrRef: 'ADR-0011',
        })
        continue
      }

      if (expected !== undefined && !extArr.includes(expected)) {
        failures.push({
          path: `${wsRel}/biome.json`,
          reason: `extends ${JSON.stringify(extArr)}, expected to include "${expected}"`,
          adrRef: 'ADR-0011',
        })
      }
    }
  }

  return failures
}
