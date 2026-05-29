// =============================================================================
// use-theme.ts — Zustand store for theme mode (light/dark/system).
// =============================================================================
//
// Persists the user's chosen mode to Expo SecureStore under `rhitta-theme`.
// Per AGENTS.md rule 8, this is pure UI state — never server data.
//
// Unlike the web variant, mobile has no DOM to apply themes to; the
// resolved theme is consumed by React Navigation and native components.
// =============================================================================

import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'rhitta-theme'

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStore.getItemAsync(name)
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return SecureStore.setItemAsync(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    return SecureStore.deleteItemAsync(name)
  },
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system' as ThemeMode,
      setMode: (mode: ThemeMode) => set({ mode }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
    }
  )
)
