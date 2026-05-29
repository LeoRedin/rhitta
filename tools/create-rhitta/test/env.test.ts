import { describe, expect, it } from 'vitest'
import { fillEnvFromExample } from '../src/env.js'

describe('fillEnvFromExample', () => {
  it('replaces the BETTER_AUTH_SECRET placeholder with the generated secret', () => {
    const example =
      'DATABASE_URL=postgres://x\nBETTER_AUTH_SECRET=replace-me\nBETTER_AUTH_URL=http://localhost:4000\n'
    const out = fillEnvFromExample(example, 'GENERATED==')
    expect(out).toContain('BETTER_AUTH_SECRET=GENERATED==')
    expect(out).not.toContain('replace-me')
    // untouched lines survive
    expect(out).toContain('DATABASE_URL=postgres://x')
    expect(out).toContain('BETTER_AUTH_URL=http://localhost:4000')
  })

  it('passes through an example with no BETTER_AUTH_SECRET line unchanged', () => {
    const example = 'VITE_API_URL=http://localhost:4000\n'
    expect(fillEnvFromExample(example, 'GENERATED==')).toBe(example)
  })
})
