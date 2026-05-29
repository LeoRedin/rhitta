import { describe, expect, it } from 'vitest'
import { deriveToolVersions } from '../src/toolversions.js'

describe('deriveToolVersions', () => {
  it('builds an asdf body from .nvmrc + packageManager', () => {
    expect(deriveToolVersions('22.22.3\n', 'pnpm@10.14.0')).toBe('nodejs 22.22.3\npnpm 10.14.0\n')
  })
  it('strips a leading v from the node version', () => {
    expect(deriveToolVersions('v20.11.0', 'pnpm@9.0.0')).toBe('nodejs 20.11.0\npnpm 9.0.0\n')
  })
  it('throws when packageManager is not pnpm@x', () => {
    expect(() => deriveToolVersions('22', 'yarn@4.0.0')).toThrow(/pnpm/i)
  })
})
