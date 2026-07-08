import { ALL_APPS, type AppName, type BuildParamsInput, type ScaffoldParams } from './types.js'

export function sanitizeSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug.length === 0) {
    throw new Error(`Cannot derive a slug from "${input}" — use letters or digits.`)
  }
  return slug
}

export function deriveEncoreId(slug: string): string {
  return slug
}

export function deriveScheme(slug: string): string {
  return slug.replace(/-/g, '')
}

export function isValidBundleId(value: string): boolean {
  return /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(value)
}

export function isAppName(value: string): value is AppName {
  return (ALL_APPS as readonly string[]).includes(value)
}

/**
 * Normalize an app selection: force-include the mandatory `api`, drop duplicates,
 * and return the selection in canonical `api, web, mobile` order.
 */
export function normalizeApps(apps: readonly AppName[]): AppName[] {
  const set = new Set<AppName>(apps)
  set.add('api')
  return ALL_APPS.filter((a) => set.has(a))
}

export function buildParams(input: BuildParamsInput): ScaffoldParams {
  const apps = normalizeApps(input.apps)
  // The bundle id only feeds the mobile app.json; validate it only when mobile is in.
  if (apps.includes('mobile') && !isValidBundleId(input.bundleId)) {
    throw new Error(`Invalid bundle id "${input.bundleId}". Use reverse-DNS, e.g. com.acme.app.`)
  }
  const slug = sanitizeSlug(input.name)
  return {
    targetDir: input.dir,
    appName: input.name,
    slug,
    encoreId: deriveEncoreId(slug),
    scheme: deriveScheme(slug),
    bundleId: input.bundleId,
    apps,
  }
}
