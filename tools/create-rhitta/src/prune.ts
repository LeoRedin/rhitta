import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type AppName, OPTIONAL_APPS } from './types.js'

/** Design-system package exclusive to a given optional app. */
const DESIGN_SYSTEM_PACKAGE: Partial<Record<AppName, string>> = {
  web: 'packages/design-system-web',
  mobile: 'packages/design-system-mobile',
}

/** Structure-validator files whose variant maps key on workspace paths. */
const VARIANT_MAP_FILES = [
  'tools/structure-validator/src/checks/tsconfig-inheritance.ts',
  'tools/structure-validator/src/checks/biome-inheritance.ts',
]

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Remove the single object-literal line whose key is `'<key>'`. No-op if absent. */
function removeMapEntryLine(content: string, key: string): string {
  const re = new RegExp(`^[^\\S\\n]*'${escapeRegExp(key)}':[^\\n]*\\n`, 'm')
  return content.replace(re, '')
}

/** Read JSON, mutate via fn, write back with 2-space indent + trailing newline. */
function editJson(path: string, fn: (json: Record<string, unknown>) => void): void {
  const json = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  fn(json)
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`)
}

/**
 * Make the vendored tree internally consistent for the chosen app set by removing every
 * deselected app and its now-dead references. `api` is mandatory and never removed.
 *
 * For each deselected optional app this removes: the `apps/<app>` dir, the app's
 * exclusive `packages/design-system-<app>` package (nothing else depends on it), the
 * root `dev:<app>` script, and the app's entries in the structure-validator variant maps
 * (`TSCONFIG_VARIANT_MAP`, `BIOME_VARIANT_MAP`). The maps iterate real workspaces, so
 * stale entries would be harmless — they are trimmed for tidiness (ADR-0028).
 *
 * Deliberately NOT touched: the shared config variants (`@rhitta/tsconfig/web.json`,
 * `@rhitta/biome-config/web-app`, and their mobile equivalents) are kept — they cost
 * nothing and keep re-adding an app low-friction. `pnpm-workspace.yaml` uses globs, so it
 * needs no edit.
 */
export function pruneApps(root: string, apps: readonly AppName[]): void {
  const selected = new Set(apps)

  for (const app of OPTIONAL_APPS) {
    if (selected.has(app)) continue

    rmSync(join(root, 'apps', app), { recursive: true, force: true })

    const designSystem = DESIGN_SYSTEM_PACKAGE[app]
    if (designSystem) rmSync(join(root, designSystem), { recursive: true, force: true })

    editJson(join(root, 'package.json'), (j) => {
      const scripts = j.scripts as Record<string, string> | undefined
      if (scripts) delete scripts[`dev:${app}`]
    })

    for (const rel of VARIANT_MAP_FILES) {
      const path = join(root, rel)
      let content = readFileSync(path, 'utf8')
      content = removeMapEntryLine(content, `apps/${app}`)
      if (designSystem) content = removeMapEntryLine(content, designSystem)
      writeFileSync(path, content)
    }
  }
}
