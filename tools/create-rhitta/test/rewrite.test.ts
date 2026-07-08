import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { rewriteIdentifiers } from '../src/rewrite.js'
import type { ScaffoldParams } from '../src/types.js'

// A Biome-clean app.json fixture (2-space indent, short arrays on one line, matching
// the vendored `apps/mobile/app.json`). The rewrite must preserve this formatting so a
// fresh scaffold passes `pnpm lint` with no manual `pnpm format` step.
const CLEAN_APP_JSON = `{
  "name": "mobile",
  "slug": "mobile",
  "scheme": "rhitta",
  "assetBundlePatterns": ["**/*"],
  "android": {
    "package": "com.rhitta.app"
  },
  "ios": {
    "bundleIdentifier": "com.rhitta.app"
  }
}
`

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
})

const PARAMS: ScaffoldParams = {
  targetDir: 'out',
  appName: 'Acme',
  slug: 'acme',
  encoreId: 'acme',
  scheme: 'acme',
  bundleId: 'com.acme.app',
}

function tree(): string {
  const root = mkdtempSync(join(tmpdir(), 'cr-rw-'))
  cleanups.push(root)
  mkdirSync(join(root, 'apps', 'api'), { recursive: true })
  mkdirSync(join(root, 'apps', 'mobile', 'scripts'), { recursive: true })
  mkdirSync(join(root, 'apps', 'web', 'scripts'), { recursive: true })
  mkdirSync(join(root, 'packages', 'contracts'), { recursive: true })
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'rhitta', version: '0.0.0' }, null, 2)
  )
  writeFileSync(
    join(root, 'apps', 'api', 'encore.app'),
    JSON.stringify({ id: 'rhitta', lang: 'typescript' }, null, 2)
  )
  writeFileSync(join(root, 'apps', 'api', '.env.example'), 'PORT=4000\nS3_BUCKET=rhitta\n')
  writeFileSync(join(root, 'apps', 'mobile', 'app.json'), CLEAN_APP_JSON)
  writeFileSync(
    join(root, 'apps', 'mobile', 'package.json'),
    JSON.stringify(
      {
        name: '@rhitta/mobile',
        scripts: { 'test:maestro': 'maestro test -e MAESTRO_APP_ID=com.rhitta.app .maestro/flows' },
      },
      null,
      2
    )
  )
  writeFileSync(join(root, 'apps', 'mobile', 'scripts', 'gen-api-client.sh'), 'APP_ID="rhitta"\n')
  writeFileSync(join(root, 'apps', 'web', 'scripts', 'gen-api-client.sh'), 'APP_ID="rhitta"\n')
  writeFileSync(
    join(root, 'packages', 'contracts', 'package.json'),
    JSON.stringify({ name: '@rhitta/contracts' }, null, 2)
  )
  return root
}

describe('rewriteIdentifiers', () => {
  it('rewrites exactly the project identifiers', () => {
    const root = tree()
    rewriteIdentifiers(root, PARAMS)
    expect(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name).toBe('acme')
    expect(JSON.parse(readFileSync(join(root, 'apps/api/encore.app'), 'utf8')).id).toBe('acme')
    expect(readFileSync(join(root, 'apps/api/.env.example'), 'utf8')).toContain('S3_BUCKET=acme')
    const appJson = JSON.parse(readFileSync(join(root, 'apps/mobile/app.json'), 'utf8'))
    expect(appJson.name).toBe('Acme')
    expect(appJson.slug).toBe('acme')
    expect(appJson.scheme).toBe('acme')
    expect(appJson.android.package).toBe('com.acme.app')
    expect(appJson.ios.bundleIdentifier).toBe('com.acme.app')
    const mobilePkg = JSON.parse(readFileSync(join(root, 'apps/mobile/package.json'), 'utf8'))
    expect(mobilePkg.scripts['test:maestro']).toContain('MAESTRO_APP_ID=com.acme.app')
    expect(readFileSync(join(root, 'apps/mobile/scripts/gen-api-client.sh'), 'utf8')).toContain(
      'APP_ID="acme"'
    )
    expect(readFileSync(join(root, 'apps/web/scripts/gen-api-client.sh'), 'utf8')).toContain(
      'APP_ID="acme"'
    )
  })

  it('leaves app.json Biome-clean so a fresh scaffold lints without manual formatting', () => {
    const root = tree()
    rewriteIdentifiers(root, PARAMS)
    const appJsonPath = join(root, 'apps/mobile/app.json')

    const before = readFileSync(appJsonPath, 'utf8')
    // Run the vendored Biome formatter with the repo's line width. If the rewrite left
    // any non-Biome formatting (e.g. a re-serialized multi-line short array), --write
    // would rewrite the file and `after` would differ.
    execFileSync('pnpm', ['exec', 'biome', 'format', '--write', '--line-width=100', appJsonPath], {
      stdio: 'ignore',
    })
    const after = readFileSync(appJsonPath, 'utf8')

    expect(after).toBe(before)
    // Short arrays stayed on one line (the specific formatting Biome expects).
    expect(after).toContain('"assetBundlePatterns": ["**/*"]')
  })

  it('does NOT touch @rhitta/* package namespaces', () => {
    const root = tree()
    rewriteIdentifiers(root, PARAMS)
    expect(JSON.parse(readFileSync(join(root, 'apps/mobile/package.json'), 'utf8')).name).toBe(
      '@rhitta/mobile'
    )
    expect(
      JSON.parse(readFileSync(join(root, 'packages/contracts/package.json'), 'utf8')).name
    ).toBe('@rhitta/contracts')
  })
})
