import type { BuildParamsInput, ScaffoldParams } from './types.js'

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

export function buildParams(input: BuildParamsInput): ScaffoldParams {
  if (!isValidBundleId(input.bundleId)) {
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
  }
}
