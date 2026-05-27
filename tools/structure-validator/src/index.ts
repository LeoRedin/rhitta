#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type Failure = { path: string; reason: string }

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..', '..')

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

function checkRequiredDirs(failures: Failure[]): void {
  for (const dir of REQUIRED_DIRS) {
    const abs = join(REPO_ROOT, dir)
    if (!isDir(abs)) {
      failures.push({ path: dir, reason: 'required directory missing' })
    }
  }
}

function checkRequiredFiles(failures: Failure[]): void {
  for (const file of REQUIRED_FILES) {
    const abs = join(REPO_ROOT, file)
    if (!existsSync(abs)) {
      failures.push({ path: file, reason: 'required file missing' })
    }
  }
}

function checkPackageNames(failures: Failure[]): void {
  for (const parent of PACKAGE_PARENTS) {
    const parentAbs = join(REPO_ROOT, parent)
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
}

function main(): number {
  const failures: Failure[] = []
  checkRequiredDirs(failures)
  checkRequiredFiles(failures)
  checkPackageNames(failures)

  if (failures.length === 0) {
    console.log('[rhitta:structure] OK')
    return 0
  }

  console.error('[rhitta:structure] FAILED')
  for (const f of failures) {
    console.error(`  - ${f.path}: ${f.reason}`)
  }
  return 1
}

process.exit(main())
