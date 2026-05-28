// =============================================================================
// use-theme.ts — Zustand store for theme mode (light/dark/system).
// =============================================================================
//
// Persists the user's chosen mode to `localStorage` under `rhitta:theme`,
// resolves `'system'` against the OS preference, and applies the resolved
// theme to `<html data-theme="...">` so Tailwind v4 token bindings pick it
// up. Per AGENTS.md rule 8, this is pure UI state — never server data.
//
// SSR-safe: all `window` / `document` access is guarded.
// =============================================================================

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

type ThemeState = {
  mode: ThemeMode
  resolved: ResolvedTheme
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'rhitta:theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

function applyToDOM(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      resolved: 'light',
      setMode: (mode) => {
        const resolved = resolveTheme(mode)
        applyToDOM(resolved)
        set({ mode, resolved })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const resolved = resolveTheme(state.mode)
        applyToDOM(resolved)
        state.resolved = resolved
      },
    }
  )
)

export function subscribeToSystemTheme(): () => void {
  if (typeof window === 'undefined') return () => {}
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const listener = () => {
    const state = useTheme.getState()
    if (state.mode === 'system') {
      const resolved = getSystemTheme()
      applyToDOM(resolved)
      useTheme.setState({ resolved })
    }
  }
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
