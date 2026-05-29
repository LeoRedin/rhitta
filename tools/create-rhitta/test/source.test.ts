import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveSource } from '../src/source.js'

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
})

function makeGitRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'cr-src-'))
  cleanups.push(dir)
  execFileSync('git', ['init', '-q'], { cwd: dir })
  execFileSync('git', ['config', 'user.email', 't@t.t'], { cwd: dir })
  execFileSync('git', ['config', 'user.name', 't'], { cwd: dir })
  writeFileSync(join(dir, 'tracked.txt'), 'hi')
  mkdirSync(join(dir, 'node_modules'))
  writeFileSync(join(dir, 'node_modules', 'junk.txt'), 'junk')
  execFileSync('git', ['add', 'tracked.txt'], { cwd: dir })
  execFileSync('git', ['commit', '-qm', 'init'], { cwd: dir })
  return dir
}

describe('resolveSource (local)', () => {
  it('copies only tracked files into a fresh temp dir', async () => {
    const src = makeGitRepo()
    const out = await resolveSource({ from: src })
    cleanups.push(out)
    expect(existsSync(join(out, 'tracked.txt'))).toBe(true)
    expect(existsSync(join(out, 'node_modules'))).toBe(false)
    expect(existsSync(join(out, '.git'))).toBe(false)
  })
})
