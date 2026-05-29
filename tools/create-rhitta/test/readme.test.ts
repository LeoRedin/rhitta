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
})
