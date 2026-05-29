import { describe, expect, it } from 'vitest'
import { deriveToolVersions } from '../src/toolversions.js'

describe('deriveToolVersions', () => {
  it('builds an asdf body from .nvmrc + packageManager', () => {
    expect(deriveToolVersions('22.22.3\n', 'pnpm@10.14.0')).toBe('nodejs 22.22.3\npnpm 10.14.0\n')
  })
  it('strips a leading v from the node version', () => {
    expect(deriveToolVersions('v20.11.0', 'pnpm@9.0.0')).toBe('nodejs 20.11.0\npnpm 9.0.0\n')
  })
  it('appends a ruby line when a .ruby-version is given', () => {
    expect(deriveToolVersions('22.22.3', 'pnpm@10.14.0', '3.4.1\n')).toBe(
      'nodejs 22.22.3\npnpm 10.14.0\nruby 3.4.1\n'
    )
  })
  it('strips a leading ruby- prefix from the ruby version', () => {
    expect(deriveToolVersions('22', 'pnpm@10.14.0', 'ruby-3.4.1')).toContain('ruby 3.4.1\n')
  })
  it('omits the ruby line when no ruby version is given', () => {
    expect(deriveToolVersions('22', 'pnpm@10.14.0')).not.toContain('ruby')
  })
  it('throws when packageManager is not pnpm@x', () => {
    expect(() => deriveToolVersions('22', 'yarn@4.0.0')).toThrow(/pnpm/i)
  })
})
