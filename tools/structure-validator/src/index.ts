#!/usr/bin/env node
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkBiomeInheritance } from './checks/biome-inheritance.js'
import { checkModuleShape } from './checks/module-shape.js'
import { checkPackageNaming } from './checks/package-naming.js'
import { checkRequiredTopLevel } from './checks/required-top-level.js'
import { checkTsconfigInheritance } from './checks/tsconfig-inheritance.js'
import { checkWorkspaceDeps } from './checks/workspace-deps.js'
import { checkWorkspaceName } from './checks/workspace-name.js'
import { checkWorkspaceShape } from './checks/workspace-shape.js'
import type { Check, Failure } from './types.js'

const HERE = dirname(fileURLToPath(import.meta.url))
// dist layout: tools/structure-validator/dist/index.js
// `../../..` from HERE lands at repo root.
const REPO_ROOT = resolve(HERE, '..', '..', '..')

const CHECKS: Check[] = [
  checkRequiredTopLevel,
  checkWorkspaceName,
  checkWorkspaceShape,
  checkTsconfigInheritance,
  checkBiomeInheritance,
  checkPackageNaming,
  checkWorkspaceDeps,
  checkModuleShape,
]

function main(): number {
  const ctx = { repoRoot: REPO_ROOT }
  const failures: Failure[] = CHECKS.flatMap((check) => check(ctx))

  if (failures.length === 0) {
    console.log('[rhitta:structure] OK')
    return 0
  }

  console.error('[rhitta:structure] FAILED')
  for (const f of failures) {
    const suffix = f.adrRef ? ` (see ${f.adrRef})` : ''
    console.error(`  - ${f.path}: ${f.reason}${suffix}`)
  }
  return 1
}

process.exit(main())
