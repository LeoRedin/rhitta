import { describe, expect, it } from 'vitest'
import { parseFlags } from '../src/prompts.js'

describe('parseFlags — app selection', () => {
  it('leaves apps undefined when no selection flag is given (interactive signal)', () => {
    expect(parseFlags(['my-app', '--name', 'X']).apps).toBeUndefined()
  })

  it('parses --apps as an allowlist and forces api in', () => {
    expect(parseFlags(['--apps', 'api,mobile']).apps).toEqual(['api', 'mobile'])
    expect(parseFlags(['--apps', 'web']).apps).toEqual(['api', 'web'])
    expect(parseFlags(['--apps', 'api,web,mobile']).apps).toEqual(['api', 'web', 'mobile'])
  })

  it('subtracts --no-web / --no-mobile from the full set', () => {
    expect(parseFlags(['--no-web']).apps).toEqual(['api', 'mobile'])
    expect(parseFlags(['--no-mobile']).apps).toEqual(['api', 'web'])
    expect(parseFlags(['--no-web', '--no-mobile']).apps).toEqual(['api'])
  })

  it('combines --apps allowlist with --no-* exclusions', () => {
    expect(parseFlags(['--apps', 'api,web,mobile', '--no-web']).apps).toEqual(['api', 'mobile'])
  })

  it('throws on an unknown app token', () => {
    expect(() => parseFlags(['--apps', 'api,desktop'])).toThrow(/desktop/i)
  })

  it('still parses the other flags alongside selection', () => {
    const f = parseFlags(['dest', '--name', 'Acme', '--bundle-id', 'com.acme.app', '--no-install'])
    expect(f.dir).toBe('dest')
    expect(f.name).toBe('Acme')
    expect(f.bundleId).toBe('com.acme.app')
    expect(f.install).toBe(false)
    expect(f.git).toBe(true)
    expect(f.apps).toBeUndefined()
  })
})
