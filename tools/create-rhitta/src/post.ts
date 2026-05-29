import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { cpSync, existsSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fillEnvFromExample } from './env.js'
import { renderReadme } from './readme.js'
import { deriveToolVersions } from './toolversions.js'
import type { ScaffoldParams } from './types.js'

/** Apps whose committed `.env.example` is copied to a runnable `.env`. */
const ENV_APPS = ['api', 'web', 'mobile']

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
  const rubyVersionPath = resolve(target, '.ruby-version')
  const ruby = existsSync(rubyVersionPath) ? readFileSync(rubyVersionPath, 'utf8') : undefined
  writeFileSync(resolve(target, '.tool-versions'), deriveToolVersions(nvmrc, packageManager, ruby))

  // Copy each app's .env.example -> .env (gitignored) with a generated dev auth secret,
  // so the project runs locally without hand-editing env files.
  const betterAuthSecret = randomBytes(32).toString('base64')
  for (const app of ENV_APPS) {
    const example = resolve(target, 'apps', app, '.env.example')
    const dotenv = resolve(target, 'apps', app, '.env')
    if (existsSync(example) && !existsSync(dotenv)) {
      writeFileSync(dotenv, fillEnvFromExample(readFileSync(example, 'utf8'), betterAuthSecret))
    }
  }

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
