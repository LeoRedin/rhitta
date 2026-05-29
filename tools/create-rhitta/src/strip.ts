import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

/** Paths (relative to tree root) removed wholesale. */
const STRIP_PATHS = [
  '.git',
  'docs/handoffs',
  'docs/superpowers',
  'apps/mobile/scripts/rhitta-overlay.sh',
  'apps/mobile/.rhitta-overlay-applied',
  // The scaffolder itself is not part of a downstream product repo.
  'tools/create-rhitta',
]

/** Workspace roots whose CHANGELOG.md (if present) is Rhitta's release history. */
const CHANGELOG_DIRS = ['', 'apps/api', 'apps/web', 'apps/mobile']

export function applyStripList(root: string): void {
  for (const rel of STRIP_PATHS) {
    rmSync(join(root, rel), { recursive: true, force: true })
  }
  // Root + per-app CHANGELOG.md, plus every packages/* and tools/* CHANGELOG.md.
  const dynamicChangelogDirs = [...CHANGELOG_DIRS]
  for (const parent of ['packages', 'tools']) {
    const abs = join(root, parent)
    if (!existsSync(abs)) continue
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (entry.isDirectory()) dynamicChangelogDirs.push(`${parent}/${entry.name}`)
    }
  }
  for (const dir of dynamicChangelogDirs) {
    rmSync(join(root, dir, 'CHANGELOG.md'), { force: true })
  }
}
