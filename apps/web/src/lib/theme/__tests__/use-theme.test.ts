// =============================================================================
// use-theme.test.ts — Zustand theme store coverage (Phase 2b Task 8).
// =============================================================================
//
// jsdom doesn't ship `matchMedia`, so every test stubs it. We exercise
// the default mode, explicit toggles, the system-preference path, the
// DOM side-effect (`data-theme`), and the `subscribeToSystemTheme`
// listener gate (only fires while mode === 'system').
// =============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { subscribeToSystemTheme, useTheme } from '../use-theme.js'

type MatchMediaListener = (event: { matches: boolean }) => void

type MatchMediaStub = {
  matches: boolean
  media: string
  onchange: null
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  addListener: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
  dispatchEvent: ReturnType<typeof vi.fn>
}

function stubMatchMedia(matches: boolean): {
  fireChange: (next: boolean) => void
  stub: MatchMediaStub
} {
  let registered: MatchMediaListener | null = null
  const stub: MatchMediaStub = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_event: string, cb: MatchMediaListener) => {
      registered = cb
    }),
    removeEventListener: vi.fn(() => {
      registered = null
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({ ...stub, media: query }))
  )
  // window.matchMedia is read directly in the store, so wire it explicitly.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      stub.media = query
      return stub
    }),
  })
  return {
    stub,
    fireChange: (next: boolean) => {
      stub.matches = next
      registered?.({ matches: next })
    },
  }
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  // Reset the store to its initial shape between tests.
  useTheme.setState({ mode: 'system', resolved: 'light' })
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-theme')
  useTheme.persist.clearStorage()
})

describe('useTheme', () => {
  it('defaults to mode "system"', () => {
    stubMatchMedia(false)
    expect(useTheme.getState().mode).toBe('system')
  })

  it('setMode("dark") resolves to "dark" and applies data-theme="dark"', () => {
    stubMatchMedia(false)
    useTheme.getState().setMode('dark')
    expect(useTheme.getState().resolved).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('setMode("light") resolves to "light" and applies data-theme="light"', () => {
    stubMatchMedia(true) // system says dark, but explicit light wins.
    useTheme.getState().setMode('light')
    expect(useTheme.getState().resolved).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('setMode("system") resolves against window.matchMedia', () => {
    stubMatchMedia(true)
    useTheme.getState().setMode('system')
    expect(useTheme.getState().resolved).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('subscribeToSystemTheme updates resolved when mode is "system"', () => {
    const { fireChange } = stubMatchMedia(false)
    useTheme.getState().setMode('system')
    expect(useTheme.getState().resolved).toBe('light')
    const unsubscribe = subscribeToSystemTheme()
    fireChange(true)
    expect(useTheme.getState().resolved).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    unsubscribe()
  })

  it('subscribeToSystemTheme does NOT update resolved when mode is explicit', () => {
    const { fireChange } = stubMatchMedia(false)
    useTheme.getState().setMode('light')
    const unsubscribe = subscribeToSystemTheme()
    fireChange(true)
    expect(useTheme.getState().resolved).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    unsubscribe()
  })
})
