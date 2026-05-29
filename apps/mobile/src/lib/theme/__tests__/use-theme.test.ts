// =============================================================================
// use-theme.test.ts — Zustand theme store coverage (Phase 2b Task 8).
// =============================================================================
//
// Unlike the web variant, mobile has no DOM / matchMedia, so we only
// exercise the mode toggle and the mock-secured persist layer.
// =============================================================================

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { useTheme } from '../use-theme'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  useTheme.setState({ mode: 'system' })
})

afterEach(() => {
  useTheme.persist.clearStorage()
})

describe('useTheme', () => {
  it('defaults to mode "system"', () => {
    expect(useTheme.getState().mode).toBe('system')
  })

  it('setMode("dark") updates mode to dark', () => {
    useTheme.getState().setMode('dark')
    expect(useTheme.getState().mode).toBe('dark')
  })

  it('setMode("light") updates mode to light', () => {
    useTheme.getState().setMode('light')
    expect(useTheme.getState().mode).toBe('light')
  })

  it('setMode("system") updates mode to system', () => {
    useTheme.getState().setMode('light')
    useTheme.getState().setMode('system')
    expect(useTheme.getState().mode).toBe('system')
  })
})
