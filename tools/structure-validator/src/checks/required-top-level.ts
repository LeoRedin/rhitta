import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, Failure } from '../types.js'

const REQUIRED_DIRS = ['apps', 'packages', 'tools', 'docs', 'docs/adr', '.github/workflows']

const REQUIRED_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'LICENSE',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  'biome.json',
  'lefthook.yml',
  'commitlint.config.mjs',
  '.nvmrc',
  '.npmrc',
  '.gitignore',
  '.gitattributes',
  '.changeset/config.json',
  '.github/workflows/ci.yml',
]

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

export const checkRequiredTopLevel: Check = ({ repoRoot }) => {
  const failures: Failure[] = []

  for (const dir of REQUIRED_DIRS) {
    const abs = join(repoRoot, dir)
    if (!isDir(abs)) {
      failures.push({ path: dir, reason: 'required directory missing' })
    }
  }

  for (const file of REQUIRED_FILES) {
    const abs = join(repoRoot, file)
    if (!existsSync(abs)) {
      failures.push({ path: file, reason: 'required file missing' })
    }
  }

  return failures
}
