import { describe, expect, it } from 'vitest'
import {
  buildParams,
  deriveEncoreId,
  deriveScheme,
  isAppName,
  isValidBundleId,
  normalizeApps,
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

describe('isAppName', () => {
  it('accepts the three known apps and rejects anything else', () => {
    expect(isAppName('api')).toBe(true)
    expect(isAppName('web')).toBe(true)
    expect(isAppName('mobile')).toBe(true)
    expect(isAppName('desktop')).toBe(false)
    expect(isAppName('')).toBe(false)
  })
})

describe('normalizeApps', () => {
  it('always includes api and returns canonical order', () => {
    expect(normalizeApps(['mobile', 'web'])).toEqual(['api', 'web', 'mobile'])
  })
  it('forces api in even when omitted', () => {
    expect(normalizeApps(['mobile'])).toEqual(['api', 'mobile'])
    expect(normalizeApps([])).toEqual(['api'])
  })
  it('drops duplicates', () => {
    expect(normalizeApps(['web', 'web', 'api'])).toEqual(['api', 'web'])
  })
})

describe('buildParams', () => {
  it('fills derived defaults from name when only name+bundleId+dir given', () => {
    const p = buildParams({
      dir: 'out',
      name: 'My Cool App',
      bundleId: 'com.acme.app',
      apps: ['api', 'web', 'mobile'],
    })
    expect(p).toEqual({
      targetDir: 'out',
      appName: 'My Cool App',
      slug: 'my-cool-app',
      encoreId: 'my-cool-app',
      scheme: 'mycoolapp',
      bundleId: 'com.acme.app',
      apps: ['api', 'web', 'mobile'],
    })
  })
  it('normalizes the app selection (api forced, canonical order)', () => {
    const p = buildParams({ dir: 'out', name: 'X', bundleId: 'com.acme.app', apps: ['mobile'] })
    expect(p.apps).toEqual(['api', 'mobile'])
  })
  it('throws on an invalid bundleId when mobile is included', () => {
    expect(() =>
      buildParams({ dir: 'out', name: 'X', bundleId: 'nope', apps: ['api', 'mobile'] })
    ).toThrow(/bundle/i)
  })
  it('does NOT validate bundleId when mobile is excluded', () => {
    const p = buildParams({ dir: 'out', name: 'X', bundleId: '', apps: ['api', 'web'] })
    expect(p.apps).toEqual(['api', 'web'])
    expect(p.bundleId).toBe('')
  })
})
