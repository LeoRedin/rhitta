/**
 * Shared types for the two-layer token system.
 *
 * `ThemedValue` represents a semantic token: a pair of values, one per theme,
 * that resolves to a primitive at consumption time. Components consume
 * semantic tokens, never primitives — see ADR-0012.
 */
export type ThemedValue<T = string> = { light: T; dark: T }

export type Theme = 'light' | 'dark'
