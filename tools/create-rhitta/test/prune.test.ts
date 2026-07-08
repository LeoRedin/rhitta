import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { pruneApps } from '../src/prune.js'

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
})

const ROOT_PKG = `{
  "name": "rhitta",
  "scripts": {
    "dev:api": "pnpm --filter @rhitta/api dev",
    "dev:web": "pnpm --filter @rhitta/web dev",
    "dev:mobile": "pnpm --filter @rhitta/mobile start",
    "validate": "pnpm -r --parallel validate && pnpm structure:validate"
  }
}
`

const TSCONFIG_MAP = `const TSCONFIG_VARIANT_MAP: Record<string, string | null> = {
  'tools/structure-validator': '@rhitta/tsconfig/node.json',
  'apps/api': '@rhitta/tsconfig/api-app.json',
  'apps/web': '@rhitta/tsconfig/web.json',
  'apps/mobile': '@rhitta/tsconfig/mobile.json',
  'packages/design-system-web': '@rhitta/tsconfig/web.json',
  'packages/design-system-mobile': '@rhitta/tsconfig/mobile.json',
}
`

const BIOME_MAP = `const BIOME_VARIANT_MAP: Record<string, string> = {
  'apps/api': '@rhitta/biome-config/api-app',
  'apps/web': '@rhitta/biome-config/web-app',
  'apps/mobile': '@rhitta/biome-config/mobile-app',
  'packages/design-system-web': '@rhitta/biome-config/react',
  'packages/design-system-mobile': '@rhitta/biome-config/react',
}
`

const TSCONFIG_MAP_PATH = 'tools/structure-validator/src/checks/tsconfig-inheritance.ts'
const BIOME_MAP_PATH = 'tools/structure-validator/src/checks/biome-inheritance.ts'

function tree(): string {
  const root = mkdtempSync(join(tmpdir(), 'cr-prune-'))
  cleanups.push(root)
  for (const app of ['api', 'web', 'mobile']) {
    mkdirSync(join(root, 'apps', app), { recursive: true })
    writeFileSync(join(root, 'apps', app, 'package.json'), `{ "name": "@rhitta/${app}" }\n`)
  }
  for (const pkg of ['design-system-web', 'design-system-mobile', 'tsconfig', 'biome-config']) {
    mkdirSync(join(root, 'packages', pkg), { recursive: true })
    writeFileSync(join(root, 'packages', pkg, 'package.json'), `{ "name": "@rhitta/${pkg}" }\n`)
  }
  mkdirSync(join(root, 'tools', 'structure-validator', 'src', 'checks'), { recursive: true })
  writeFileSync(join(root, 'package.json'), ROOT_PKG)
  writeFileSync(join(root, TSCONFIG_MAP_PATH), TSCONFIG_MAP)
  writeFileSync(join(root, BIOME_MAP_PATH), BIOME_MAP)
  return root
}

function read(root: string, rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

describe('pruneApps', () => {
  it('is a no-op when all apps are selected', () => {
    const root = tree()
    pruneApps(root, ['api', 'web', 'mobile'])
    expect(existsSync(join(root, 'apps/web'))).toBe(true)
    expect(existsSync(join(root, 'apps/mobile'))).toBe(true)
    expect(read(root, 'package.json')).toBe(ROOT_PKG)
    expect(read(root, TSCONFIG_MAP_PATH)).toBe(TSCONFIG_MAP)
    expect(read(root, BIOME_MAP_PATH)).toBe(BIOME_MAP)
  })

  it('drops web and its design-system, keeping mobile (the A Dois case)', () => {
    const root = tree()
    pruneApps(root, ['api', 'mobile'])

    expect(existsSync(join(root, 'apps/web'))).toBe(false)
    expect(existsSync(join(root, 'packages/design-system-web'))).toBe(false)
    expect(existsSync(join(root, 'apps/mobile'))).toBe(true)
    expect(existsSync(join(root, 'packages/design-system-mobile'))).toBe(true)

    const pkg = JSON.parse(read(root, 'package.json')) as { scripts: Record<string, string> }
    expect(pkg.scripts['dev:web']).toBeUndefined()
    expect(pkg.scripts['dev:api']).toBeDefined()
    expect(pkg.scripts['dev:mobile']).toBeDefined()

    for (const rel of [TSCONFIG_MAP_PATH, BIOME_MAP_PATH]) {
      const map = read(root, rel)
      expect(map).not.toContain("'apps/web'")
      expect(map).not.toContain("'packages/design-system-web'")
      expect(map).toContain("'apps/mobile'")
      expect(map).toContain("'packages/design-system-mobile'")
      expect(map).toContain("'apps/api'")
    }
  })

  it('drops mobile and its design-system, keeping web', () => {
    const root = tree()
    pruneApps(root, ['api', 'web'])

    expect(existsSync(join(root, 'apps/mobile'))).toBe(false)
    expect(existsSync(join(root, 'packages/design-system-mobile'))).toBe(false)
    expect(existsSync(join(root, 'apps/web'))).toBe(true)
    expect(existsSync(join(root, 'packages/design-system-web'))).toBe(true)

    const pkg = JSON.parse(read(root, 'package.json')) as { scripts: Record<string, string> }
    expect(pkg.scripts['dev:mobile']).toBeUndefined()
    expect(pkg.scripts['dev:web']).toBeDefined()
  })

  it('leaves only api when neither optional app is selected', () => {
    const root = tree()
    pruneApps(root, ['api'])

    expect(existsSync(join(root, 'apps/web'))).toBe(false)
    expect(existsSync(join(root, 'apps/mobile'))).toBe(false)
    expect(existsSync(join(root, 'packages/design-system-web'))).toBe(false)
    expect(existsSync(join(root, 'packages/design-system-mobile'))).toBe(false)
    expect(existsSync(join(root, 'apps/api'))).toBe(true)

    const pkg = JSON.parse(read(root, 'package.json')) as { scripts: Record<string, string> }
    expect(Object.keys(pkg.scripts)).toEqual(['dev:api', 'validate'])

    for (const rel of [TSCONFIG_MAP_PATH, BIOME_MAP_PATH]) {
      const map = read(root, rel)
      expect(map).not.toContain('web')
      expect(map).not.toContain('mobile')
      expect(map).toContain("'apps/api'")
    }
  })

  it('keeps the shared config packages (tsconfig, biome-config)', () => {
    const root = tree()
    pruneApps(root, ['api'])
    expect(existsSync(join(root, 'packages/tsconfig'))).toBe(true)
    expect(existsSync(join(root, 'packages/biome-config'))).toBe(true)
  })
})
