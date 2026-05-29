import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { applyStripList } from '../src/strip.js'

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
})

function fakeTree(): string {
  const root = mkdtempSync(join(tmpdir(), 'cr-strip-'))
  cleanups.push(root)
  mkdirSync(join(root, 'docs', 'handoffs'), { recursive: true })
  mkdirSync(join(root, 'docs', 'adr'), { recursive: true })
  mkdirSync(join(root, 'docs', 'superpowers', 'plans'), { recursive: true })
  mkdirSync(join(root, 'apps', 'mobile', 'scripts'), { recursive: true })
  mkdirSync(join(root, 'tools', 'create-rhitta', 'src'), { recursive: true })
  mkdirSync(join(root, 'tools', 'structure-validator'), { recursive: true })
  mkdirSync(join(root, '.changeset'), { recursive: true })
  writeFileSync(join(root, 'docs', 'handoffs', 'h.md'), 'x')
  writeFileSync(join(root, 'docs', 'adr', '0001.md'), 'keep')
  writeFileSync(join(root, 'docs', 'superpowers', 'plans', 'p.md'), 'x')
  writeFileSync(join(root, 'apps', 'mobile', 'scripts', 'rhitta-overlay.sh'), 'x')
  writeFileSync(join(root, 'apps', 'mobile', '.rhitta-overlay-applied'), '0.1.0')
  writeFileSync(join(root, 'tools', 'create-rhitta', 'src', 'index.ts'), 'x')
  writeFileSync(join(root, 'tools', 'structure-validator', 'package.json'), '{}')
  writeFileSync(join(root, 'CHANGELOG.md'), 'x')
  writeFileSync(join(root, '.changeset', 'config.json'), '{}')
  writeFileSync(join(root, 'CONTEXT.md'), 'keep')
  return root
}

describe('applyStripList', () => {
  it('removes Rhitta-internal artifacts and keeps the rest', () => {
    const root = fakeTree()
    applyStripList(root)
    expect(existsSync(join(root, 'docs', 'handoffs'))).toBe(false)
    expect(existsSync(join(root, 'docs', 'superpowers'))).toBe(false)
    expect(existsSync(join(root, 'apps', 'mobile', 'scripts', 'rhitta-overlay.sh'))).toBe(false)
    expect(existsSync(join(root, 'apps', 'mobile', '.rhitta-overlay-applied'))).toBe(false)
    expect(existsSync(join(root, 'CHANGELOG.md'))).toBe(false)
    expect(existsSync(join(root, 'tools', 'create-rhitta'))).toBe(false)
    // kept:
    expect(existsSync(join(root, 'docs', 'adr', '0001.md'))).toBe(true)
    expect(existsSync(join(root, '.changeset', 'config.json'))).toBe(true)
    expect(existsSync(join(root, 'CONTEXT.md'))).toBe(true)
    expect(existsSync(join(root, 'tools', 'structure-validator'))).toBe(true)
  })

  it('is idempotent (no throw if a target is already absent)', () => {
    const root = fakeTree()
    applyStripList(root)
    expect(() => applyStripList(root)).not.toThrow()
  })
})
