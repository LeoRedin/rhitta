// =============================================================================
// theme/index.ts — public re-export hub for theme primitives.
// =============================================================================
//
// Consumers import the Zustand hook (`useTheme`), the system-preference
// subscription helper, and the pre-hydration `<ThemeScript />` from this
// barrel.
// =============================================================================

export * from './theme-script.js'
export * from './use-theme.js'
