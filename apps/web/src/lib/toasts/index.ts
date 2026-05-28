// =============================================================================
// toasts/index.ts — public re-export hub for the toast queue.
// =============================================================================
//
// Consumers (mutation hooks, the app shell's Toast viewport) import the
// Zustand store and types from this barrel.
// =============================================================================

export * from './use-toast-queue.js'
