import { describe, expect, it } from 'vitest'
import { renderReadme } from '../src/readme.js'
import type { ScaffoldParams } from '../src/types.js'

const PARAMS: ScaffoldParams = {
  targetDir: 'out',
  appName: 'Acme',
  slug: 'acme',
  encoreId: 'acme',
  scheme: 'acme',
  bundleId: 'com.acme.app',
  apps: ['api', 'web', 'mobile'],
}

describe('renderReadme', () => {
  it('uses the app name as the title and mentions the three apps + validate', () => {
    const md = renderReadme(PARAMS)
    expect(md.startsWith('# Acme')).toBe(true)
    expect(md).toContain('pnpm install')
    expect(md).toContain('pnpm build')
    expect(md).toContain('pnpm validate')
    expect(md).toContain('apps/api')
    expect(md).toContain('apps/web')
    expect(md).toContain('apps/mobile')
    expect(md).toContain('AGENTS.md')
  })
  it('does not leak the name "Rhitta" as the project title', () => {
    expect(renderReadme(PARAMS).startsWith('# Rhitta')).toBe(false)
  })
  it('lists only the included apps (api + mobile)', () => {
    const md = renderReadme({ ...PARAMS, apps: ['api', 'mobile'] })
    expect(md).toContain('for API + mobile.')
    expect(md).toContain('apps/api')
    expect(md).toContain('apps/mobile')
    expect(md).toContain('dev:mobile')
    expect(md).not.toContain('apps/web')
    expect(md).not.toContain('dev:web')
  })
  it('lists only the API for an api-only project', () => {
    const md = renderReadme({ ...PARAMS, apps: ['api'] })
    expect(md).toContain('for API.')
    expect(md).toContain('dev:api')
    expect(md).not.toContain('apps/web')
    expect(md).not.toContain('apps/mobile')
    expect(md).not.toContain('dev:mobile')
  })
})
