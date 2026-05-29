import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface ResolveSourceOptions {
  /** Local Rhitta checkout to vendor from (testing path). */
  from?: string
  /** GitHub "owner/repo" for the remote path. */
  repo?: string
  /** Git ref/tag for the remote path. */
  ref?: string
}

const DEFAULT_REPO = 'LeoRedin/rhitta'
// Vendor the default branch during the v0 validation phase so scaffolds pick up
// in-flight fixes. Switch to a pinned tag for reproducible public releases once the
// validation milestone completes (and the `v*` release trigger is reconciled).
const DEFAULT_REF = 'main'

/**
 * Materialize a clean copy of the Rhitta tree into a fresh temp directory.
 * Local: `git archive` at HEAD — yields tracked files only (no .git, node_modules, dist).
 * Remote: tiged clones the GitHub ref without git history.
 */
export async function resolveSource(opts: ResolveSourceOptions): Promise<string> {
  const dest = mkdtempSync(join(tmpdir(), 'create-rhitta-'))
  if (opts.from) {
    // `git archive | tar -x` copies exactly the tracked tree at HEAD.
    const tar = execFileSync('git', ['archive', '--format=tar', 'HEAD'], {
      cwd: opts.from,
      maxBuffer: 512 * 1024 * 1024,
    })
    execFileSync('tar', ['-x', '-C', dest], { input: tar, maxBuffer: 512 * 1024 * 1024 })
    return dest
  }
  const { default: tiged } = await import('tiged')
  const repo = opts.repo ?? DEFAULT_REPO
  const ref = opts.ref ?? DEFAULT_REF
  await tiged(`${repo}#${ref}`, { cache: false, force: true, verbose: false }).clone(dest)
  return dest
}
