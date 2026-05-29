import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderReadme } from './readme.js'
import { deriveToolVersions } from './toolversions.js'
import type { ScaffoldParams } from './types.js'

/** Move the transformed temp tree into the target dir, write README, git init, install, build. */
export function finalize(
  tempTree: string,
  params: ScaffoldParams,
  opts: { install: boolean; git: boolean }
): string {
  const target = resolve(process.cwd(), params.targetDir)
  if (existsSync(target)) {
    throw new Error(`Target directory already exists: ${target}`)
  }
  cpSync(tempTree, target, { recursive: true })
  rmSync(tempTree, { recursive: true, force: true })

  // git archive may not preserve the CLAUDE.md → AGENTS.md symlink; structure-validator requires it.
  const claudeMd = resolve(target, 'CLAUDE.md')
  try {
    rmSync(claudeMd, { force: true })
    symlinkSync('AGENTS.md', claudeMd)
  } catch {
    // symlink already valid or filesystem does not support symlinks — not fatal.
  }

  writeFileSync(resolve(target, 'README.md'), renderReadme(params))

  // Emit .tool-versions (derived from .nvmrc + packageManager) so asdf users — and the
  // pnpm calls below — resolve node + pnpm in the new dir with no manual setup.
  const nvmrc = readFileSync(resolve(target, '.nvmrc'), 'utf8')
  const { packageManager = '' } = JSON.parse(
    readFileSync(resolve(target, 'package.json'), 'utf8')
  ) as { packageManager?: string }
  writeFileSync(resolve(target, '.tool-versions'), deriveToolVersions(nvmrc, packageManager))

  if (opts.git) {
    execFileSync('git', ['init', '-q'], { cwd: target })
  }
  if (opts.install) {
    execFileSync('pnpm', ['install'], { cwd: target, stdio: 'inherit' })
    // Shared packages export from dist/; build them so the project typechecks/validates immediately.
    execFileSync('pnpm', ['build'], { cwd: target, stdio: 'inherit' })
  }
  return target
}
