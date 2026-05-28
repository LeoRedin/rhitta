/**
 * Theme bridge — Ignite-compatible theme hook.
 *
 * Components consume @rhitta/design-tokens/semantic through this hook.
 * In Phase 2c the hook returns fallback values; the real Ignite theme provider
 * lands in apps/mobile/app/_layout.tsx (Task 9) and this file will be updated
 * to re-export Ignite's useAppTheme().
 *
 * For now, every primitive accepts explicit props (variant, size, error) and
 * maps them via FALLBACK_COLORS below. This keeps the package testable without
 * a full RN + Ignite render-tree.
 */

export const FALLBACK_COLORS = {
	primary: "#3B82F6",
	error: "#EF4444",
	surface: "#FFFFFF",
	text: "#111827",
	textInverse: "#FFFFFF",
	border: "#D1D5DB",
	success: "#22C55E",
	info: "#3B82F6",
} as const;

export type ThemeColors = typeof FALLBACK_COLORS;

/**
 * Typed hook that primitives will use once Ignite's provider is wired.
 * Currently returns fallback colors. The function signature matches what
 * Ignite's useAppTheme() will eventually return.
 */
export function useAppTheme(): { colors: ThemeColors } {
	return { colors: FALLBACK_COLORS };
}
