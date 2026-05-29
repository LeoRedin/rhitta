import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderReadme } from './readme.js'
import type { ScaffoldParams } from './types.js'

/** Move the transformed temp tree into the target dir, write README, git init, install. */
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

  writeFileSync(resolve(target, 'README.md'), renderReadme(params))

  if (opts.git) {
    execFileSync('git', ['init', '-q'], { cwd: target })
  }
  if (opts.install) {
    execFileSync('pnpm', ['install'], { cwd: target, stdio: 'inherit' })
  }
  return target
}
