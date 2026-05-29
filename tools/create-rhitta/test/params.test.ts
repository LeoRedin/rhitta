import { describe, expect, it } from 'vitest'
import {
  buildParams,
  deriveEncoreId,
  deriveScheme,
  isValidBundleId,
  sanitizeSlug,
} from '../src/params.js'

describe('sanitizeSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(sanitizeSlug('My Cool App')).toBe('my-cool-app')
  })
  it('collapses runs of non-alphanumerics and trims', () => {
    expect(sanitizeSlug('  Foo__Bar!!Baz  ')).toBe('foo-bar-baz')
  })
  it('throws on empty result', () => {
    expect(() => sanitizeSlug('!!!')).toThrow()
  })
})

describe('deriveScheme', () => {
  it('removes hyphens from the slug', () => {
    expect(deriveScheme('my-cool-app')).toBe('mycoolapp')
  })
})

describe('deriveEncoreId', () => {
  it('equals the slug', () => {
    expect(deriveEncoreId('my-cool-app')).toBe('my-cool-app')
  })
})

describe('isValidBundleId', () => {
  it('accepts reverse-DNS with >=2 segments', () => {
    expect(isValidBundleId('com.acme.app')).toBe(true)
    expect(isValidBundleId('com.acme')).toBe(true)
  })
  it('rejects single segment, uppercase, leading digit', () => {
    expect(isValidBundleId('app')).toBe(false)
    expect(isValidBundleId('Com.Acme.App')).toBe(false)
    expect(isValidBundleId('com.1acme.app')).toBe(false)
  })
})

describe('buildParams', () => {
  it('fills derived defaults from name when only name+bundleId+dir given', () => {
    const p = buildParams({ dir: 'out', name: 'My Cool App', bundleId: 'com.acme.app' })
    expect(p).toEqual({
      targetDir: 'out',
      appName: 'My Cool App',
      slug: 'my-cool-app',
      encoreId: 'my-cool-app',
      scheme: 'mycoolapp',
      bundleId: 'com.acme.app',
    })
  })
  it('throws on an invalid bundleId', () => {
    expect(() => buildParams({ dir: 'out', name: 'X', bundleId: 'nope' })).toThrow(/bundle/i)
  })
})
