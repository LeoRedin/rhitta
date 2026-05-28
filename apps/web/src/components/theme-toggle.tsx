// =============================================================================
// theme-toggle.tsx — three-state theme switcher (light / dark / system).
// =============================================================================
//
// Reads / writes the Zustand theme store directly. Each button toggles
// `useTheme().setMode(...)`, which both applies `data-theme` to `<html>`
// and persists the choice. The `aria-pressed` attribute keeps the active
// state accessible to screen readers; `role="group"` + `aria-label`
// communicates that this is a single control group rather than three
// independent buttons.
//
// v0 ships as an icon triplet — a dropdown variant can land later
// without breaking consumers because the export shape is fixed.
// =============================================================================

import { type ThemeMode, useTheme } from '../lib/theme/index.js'

const MODES: ReadonlyArray<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: '☀' },
  { value: 'dark', label: 'Dark', icon: '☾' },
  { value: 'system', label: 'System', icon: '⚙' },
]

export function ThemeToggle() {
  const mode = useTheme((state) => state.mode)
  const setMode = useTheme((state) => state.setMode)

  return (
    <fieldset aria-label="Theme" className="flex gap-1 rounded-md border border-border-default p-1">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => setMode(m.value)}
          aria-pressed={mode === m.value}
          title={m.label}
          className={`rounded px-2 py-1 text-sm ${
            mode === m.value
              ? 'bg-bg-surface-raised text-text-body'
              : 'text-text-muted hover:text-text-body'
          }`}
        >
          {m.icon}
        </button>
      ))}
    </fieldset>
  )
}
