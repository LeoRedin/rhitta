import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

const WORKSPACE_PARENTS = ['apps', 'packages', 'tools']

type PackageJson = {
  name?: unknown
  dependencies?: Record<string, unknown>
  devDependencies?: Record<string, unknown>
}

type Workspace = {
  wsRel: string
  name: string
  deps: string[]
  devDeps: string[]
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

function isWorkspaceVersion(version: unknown): boolean {
  return typeof version === 'string' && /^workspace:[\^*~]?/.test(version)
}

function collectRhittaDeps(deps: Record<string, unknown> | undefined): string[] {
  if (!deps || typeof deps !== 'object') return []
  return Object.keys(deps).filter((k) => k.startsWith('@rhitta/'))
}

function findCycles(workspaces: Workspace[]): string[][] {
  const byName = new Map<string, Workspace>()
  for (const w of workspaces) byName.set(w.name, w)

  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map<string, number>()
  for (const w of workspaces) color.set(w.name, WHITE)

  const cycles: string[][] = []
  const stack: string[] = []

  function dfs(name: string): void {
    color.set(name, GRAY)
    stack.push(name)

    const node = byName.get(name)
    if (node) {
      const all = [...node.deps, ...node.devDeps]
      for (const dep of all) {
        if (!byName.has(dep)) continue
        const c = color.get(dep) ?? WHITE
        if (c === GRAY) {
          const idx = stack.indexOf(dep)
          const cycle = stack.slice(idx).concat(dep)
          cycles.push(cycle)
        } else if (c === WHITE) {
          dfs(dep)
        }
      }
    }

    stack.pop()
    color.set(name, BLACK)
  }

  for (const w of workspaces) {
    if ((color.get(w.name) ?? WHITE) === WHITE) dfs(w.name)
  }

  return cycles
}

export const checkWorkspaceDeps: Check = ({ repoRoot }) => {
  const failures: Failure[] = []
  const workspaces: Workspace[] = []

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

      const name = typeof pkg.name === 'string' ? pkg.name : ''

      // workspace:* version protocol enforcement for @rhitta/* deps
      const checkBlock = (
        block: Record<string, unknown> | undefined,
        blockName: 'dependencies' | 'devDependencies'
      ): void => {
        if (!block || typeof block !== 'object') return
        for (const [dep, version] of Object.entries(block)) {
          if (!dep.startsWith('@rhitta/')) continue
          if (!isWorkspaceVersion(version)) {
            failures.push({
              path: `${wsRel}/package.json`,
              reason: `${blockName}["${dep}"] = ${JSON.stringify(version)}; must use "workspace:*" (or workspace:^) protocol`,
              adrRef: 'ADR-0003',
            })
          }
        }
      }

      checkBlock(pkg.dependencies, 'dependencies')
      checkBlock(pkg.devDependencies, 'devDependencies')

      workspaces.push({
        wsRel,
        name,
        deps: collectRhittaDeps(pkg.dependencies),
        devDeps: collectRhittaDeps(pkg.devDependencies),
      })
    }
  }

  // apps ↔ apps cross-dep ban
  const wsByName = new Map<string, Workspace>()
  for (const w of workspaces) wsByName.set(w.name, w)

  for (const w of workspaces) {
    if (!w.wsRel.startsWith('apps/')) continue
    const allDeps = [...w.deps, ...w.devDeps]
    for (const dep of allDeps) {
      const target = wsByName.get(dep)
      if (!target) continue
      if (target.wsRel.startsWith('apps/') && target.name !== w.name) {
        failures.push({
          path: `${w.wsRel}/package.json`,
          reason: `app "${w.name}" depends on another app "${dep}" (${target.wsRel}); apps must not depend on each other`,
          adrRef: 'ADR-0003',
        })
      }
    }
  }

  // Cycle detection on @rhitta/* workspace dep graph
  const cycles = findCycles(workspaces)
  for (const cycle of cycles) {
    failures.push({
      path: cycle[0] ?? '<unknown>',
      reason: `dependency cycle detected: ${cycle.join(' -> ')}`,
      adrRef: 'ADR-0003',
    })
  }

  return failures
}
