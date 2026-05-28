import { colors } from './primitive.js'
import type { ThemedValue } from './types.js'

/**
 * Semantic tokens — aliases that components consume.
 *
 * Per ADR-0012, every semantic token resolves to a primitive value, and ships
 * with both a `light` and a `dark` reading. Components reference these
 * semantic names exclusively; primitives are off-limits.
 *
 * Note: `#FFFFFF` (pure white) is used directly where the primitive `neutral`
 * scale starts at `50` and there is no `neutral[0]`. Documented as a
 * deliberate exception per the Phase 1 handoff.
 *
 * Total leaves: 20 (15 themed pairs across bg / text / border).
 */
export const semantic = {
  bg: {
    app: { light: colors.neutral[50], dark: colors.neutral[950] } satisfies ThemedValue,
    surface: { light: '#FFFFFF', dark: colors.neutral[900] } satisfies ThemedValue,
    surfaceRaised: { light: colors.neutral[50], dark: colors.neutral[800] } satisfies ThemedValue,
    inverse: { light: colors.neutral[900], dark: colors.neutral[50] } satisfies ThemedValue,
  },
  text: {
    body: { light: colors.neutral[900], dark: colors.neutral[50] } satisfies ThemedValue,
    muted: { light: colors.neutral[600], dark: colors.neutral[400] } satisfies ThemedValue,
    inverse: { light: colors.neutral[50], dark: colors.neutral[900] } satisfies ThemedValue,
    brand: {
      light: colors.brand.primary,
      dark: colors.brand.primary,
    } satisfies ThemedValue,
    danger: {
      light: colors.semantic.danger,
      dark: colors.semantic.danger,
    } satisfies ThemedValue,
  },
  border: {
    default: { light: colors.neutral[200], dark: colors.neutral[800] } satisfies ThemedValue,
    strong: { light: colors.neutral[300], dark: colors.neutral[700] } satisfies ThemedValue,
    focus: {
      light: colors.brand.primary,
      dark: colors.brand.primary,
    } satisfies ThemedValue,
  },
} as const
