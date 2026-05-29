#!/usr/bin/env bash
set -euo pipefail

# rhitta-overlay.sh — idempotent post-install patch script.
# Applies Rhitta conventions on top of an Ignite-scaffolded app.
# Run after: npx ignite-cli new mobile --bundle com.rhitta.app --no-git
# Idempotent: safe to run twice. Writes .rhitta-overlay-applied marker.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
OVERLAY_VERSION="0.1.0"

echo "[rhitta-overlay] v$OVERLAY_VERSION — applying Rhitta conventions..."

cd "$APP_DIR"

# ---- 0. Idempotency guard ----
MARKER="$APP_DIR/.rhitta-overlay-applied"
if [ -f "$MARKER" ]; then
  APPLIED=$(head -n1 "$MARKER")
  if [ "$APPLIED" = "$OVERLAY_VERSION" ]; then
    echo "[rhitta-overlay] v$OVERLAY_VERSION already applied. Skipping."
    exit 0
  fi
  echo "[rhitta-overlay] upgrading from $APPLIED to $OVERLAY_VERSION..."
fi

# ---- 1. Update package.json ----
echo "[rhitta-overlay] Updating package.json..."
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.name = "@rhitta/mobile";
pkg.private = true;
// Remove MST/MobX deps
delete pkg.dependencies["mobx"];
delete pkg.dependencies["mobx-react-lite"];
delete pkg.dependencies["mobx-state-tree"];
// Remove MST/MobX devDeps
delete pkg.devDependencies["mobx"];
delete pkg.devDependencies["mobx-state-tree"];
// Add Biome & Tsconfig deps for config resolution
pkg.devDependencies["@rhitta/biome-config"] = "workspace:*";
pkg.devDependencies["@rhitta/tsconfig"] = "workspace:*";
// Add Rhitta workspace deps
pkg.dependencies["@rhitta/design-tokens"] = "workspace:*";
pkg.dependencies["@rhitta/contracts"] = "workspace:*";
pkg.dependencies["@rhitta/design-system-mobile"] = "workspace:*";
pkg.dependencies["@tanstack/react-query"] = "^5.0.0";
pkg.dependencies["@tanstack/react-form"] = "^1.0.0";
pkg.dependencies["zustand"] = "^5.0.0";
pkg.dependencies["better-auth"] = "^1.0.0";
pkg.dependencies["expo-router"] = "^4.0.0";
pkg.dependencies["expo-secure-store"] = "^14.0.0";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("package.json updated.");
'

# ---- 2. Strip MST models ----
echo "[rhitta-overlay] Stripping MST models..."
rm -rf app/models 2>/dev/null || true

# ---- 3. Strip Ignite navigators / example screens ----
echo "[rhitta-overlay] Stripping Ignite navigators and example screens..."
rm -rf app/navigators 2>/dev/null || true
rm -rf app/screens 2>/dev/null || true
rm -f app/screens/*.tsx 2>/dev/null || true

# ---- 4. Create Rhitta directory structure ----
echo "[rhitta-overlay] Creating Rhitta directory structure..."
mkdir -p app/auth
mkdir -p app/_authenticated/notes/\[noteId\]
mkdir -p src/lib/api-client
mkdir -p src/lib/auth
mkdir -p src/lib/queries
mkdir -p src/lib/realtime
mkdir -p src/lib/theme
mkdir -p src/lib/toasts
mkdir -p scripts

# ---- 5. Inject Rhitta config files ----
echo "[rhitta-overlay] Injecting Rhitta configs..."

# tsconfig.json
cat > tsconfig.json << 'TSEOF'
{
  "extends": "@rhitta/tsconfig/mobile.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"],
      "@/*": ["./app/*"],
      "@assets/*": ["./assets/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", ".expo"]
}
TSEOF

# biome.json
cat > biome.json << 'BIOMEEOF'
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "root": false,
  "extends": [
    "@rhitta/biome-config/base",
    "@rhitta/biome-config/react",
    "@rhitta/biome-config/mobile-app"
  ],
  "linter": {
    "rules": {
      "correctness": {
        "noUndeclaredDependencies": "off",
        "useHookAtTopLevel": "off"
      },
      "performance": {
        "noAccumulatingSpread": "off"
      },
      "complexity": {
        "noBannedTypes": "off"
      },
      "suspicious": {
        "noExplicitAny": "off",
        "noImplicitAnyLet": "off"
      }
    }
  }
}
BIOMEEOF

# ---- 6. Patch theme to use design-tokens ----
echo "[rhitta-overlay] Patching theme to use @rhitta/design-tokens..."
# Ignite's ThemeProvider expects flat objects (e.g. `{ text: '#000', background: '#FFF' }`),
# not the nested semantic structure from design-tokens (`{ bg: { app: ThemedValue } }`).
# The files below are adapters: flat Ignite shape, values sourced from design-tokens.
# colorsDark.ts and spacingDark.ts are also patched — they ship dark-mode values.
if [ -f app/theme/colors.ts ]; then
  cat > app/theme/colors.ts << 'COLORSEOF'
// Light theme — flat shape for Ignite ThemeProvider. Values from @rhitta/design-tokens.
export const colors = {
  palette: {
    neutral900: '#0F172A', neutral800: '#1E293B', neutral700: '#334155', neutral600: '#475569',
    neutral500: '#64748B', neutral400: '#94A3B8', neutral300: '#CBD5E1', neutral200: '#E2E8F0',
    neutral100: '#F1F5F9',
    primary600: '#DBEAFE', primary500: '#BFDBFE', primary400: '#93C5FD', primary300: '#60A5FA',
    primary200: '#3B82F6', primary100: '#2563EB',
    secondary500: '#EDE9FE', secondary400: '#DDD6FE', secondary300: '#C4B5FD', secondary200: '#A78BFA',
    secondary100: '#8B5CF6',
    accent500: '#FEF3C7', accent400: '#FDE68A', accent300: '#FCD34D', accent200: '#FBBF24',
    accent100: '#F59E0B',
    angry100: '#FEE2E2', angry500: '#EF4444',
    overlay20: 'rgba(15, 23, 42, 0.2)', overlay50: 'rgba(15, 23, 42, 0.5)',
  },
  transparent: 'rgba(0, 0, 0, 0)',
  text: '#0F172A', textDim: '#64748B', background: '#F8FAFC', border: '#CBD5E1',
  tint: '#3B82F6', tintInactive: '#CBD5E1', separator: '#CBD5E1',
  error: '#EF4444', errorBackground: '#FEE2E2',
} as const
COLORSEOF
fi

if [ -f app/theme/colorsDark.ts ]; then
  cat > app/theme/colorsDark.ts << 'COLORSDARKEOF'
// Dark theme — flat shape for Ignite ThemeProvider. Values from @rhitta/design-tokens.
export const colors = {
  palette: {
    neutral900: '#FFFFFF', neutral800: '#F4F2F1', neutral700: '#D7CEC9', neutral600: '#B6ACA6',
    neutral500: '#978F8A', neutral400: '#564E4A', neutral300: '#3C3836', neutral200: '#191015',
    neutral100: '#000000',
    primary600: '#1E3A5F', primary500: '#1E40AF', primary400: '#2563EB', primary300: '#3B82F6',
    primary200: '#60A5FA', primary100: '#93C5FD',
    secondary500: '#312E81', secondary400: '#4338CA', secondary300: '#6366F1', secondary200: '#818CF8',
    secondary100: '#A5B4FC',
    accent500: '#78350F', accent400: '#92400E', accent300: '#B45309', accent200: '#D97706',
    accent100: '#F59E0B',
    angry100: '#7F1D1D', angry500: '#EF4444',
    overlay20: 'rgba(0, 0, 0, 0.2)', overlay50: 'rgba(0, 0, 0, 0.5)',
  },
  transparent: 'rgba(0, 0, 0, 0)',
  text: '#F8FAFC', textDim: '#94A3B8', background: '#020617', border: '#334155',
  tint: '#60A5FA', tintInactive: '#475569', separator: '#334155',
  error: '#EF4444', errorBackground: '#7F1D1D',
} as const
COLORSDARKEOF
fi

if [ -f app/theme/typography.ts ]; then
  cat > app/theme/typography.ts << 'TYPOEOF'
// Font weight → font family mapping for Ignite's Text component. System fonts.
export const typography = {
  primary: {
    normal: 'System', medium: 'System', bold: 'System',
    thin: 'System', light: 'System', black: 'System',
  },
} as const
TYPOEOF
fi

if [ -f app/theme/spacing.ts ]; then
  cat > app/theme/spacing.ts << 'SPACEOF'
// Spacing scale for Ignite's themed components. Numeric RN units.
export const spacing = {
  xxxs: 2, xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
} as const
SPACEOF
fi

if [ -f app/theme/spacingDark.ts ]; then
  cat > app/theme/spacingDark.ts << 'SPACINGDARKEOF'
// Dark theme spacing — same scale, same multipliers.
const SPACING_MULTIPLIER = 1.0
export const spacing = {
  xxxs: 2 * SPACING_MULTIPLIER, xxs: 4 * SPACING_MULTIPLIER, xs: 8 * SPACING_MULTIPLIER,
  sm: 12 * SPACING_MULTIPLIER, md: 16 * SPACING_MULTIPLIER, lg: 24 * SPACING_MULTIPLIER,
  xl: 32 * SPACING_MULTIPLIER, xxl: 48 * SPACING_MULTIPLIER, xxxl: 64 * SPACING_MULTIPLIER,
} as const
SPACINGDARKEOF
fi

# ---- 7. Patch metro.config.js for pnpm monorepo ----
echo "[rhitta-overlay] Patching metro.config.js for pnpm monorepo..."
node -e '
const fs = require("fs");
let metro = fs.readFileSync("metro.config.js", "utf8");
// If watchFolders is not already set, inject the pnpm-compatible config
if (!metro.includes("watchFolders")) {
  const patch = `
// Rhitta overlay: Metro pnpm monorepo resolution.
// Metro must traverse symlinked workspace deps; default Metro config does not.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const repoRoot = path.resolve(__dirname, "../..");
const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.watchFolders = [repoRoot, path.resolve(__dirname, "node_modules")];
defaultConfig.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(repoRoot, "node_modules"),
];
module.exports = defaultConfig;
`;
  fs.writeFileSync("metro.config.js", patch);
  console.log("metro.config.js patched for pnpm monorepo.");
} else {
  console.log("metro.config.js already has watchFolders — skipping.");
}
'

# ---- 8. Write idempotency marker ----
echo "$OVERLAY_VERSION" > "$MARKER"
echo "[rhitta-overlay] Done. Rhitta conventions applied (v$OVERLAY_VERSION)."
