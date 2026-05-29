/**
 * Derive an asdf `.tool-versions` body from the project's single sources of truth:
 * `.nvmrc` (Node) and `package.json`'s `packageManager` field (pnpm). Keeping this
 * derived means no second version file to drift in the Rhitta repo itself.
 */
export function deriveToolVersions(nvmrc: string, packageManager: string): string {
  const node = nvmrc.trim().replace(/^v/, '')
  const pnpmMatch = /^pnpm@(.+)$/.exec(packageManager.trim())
  if (!pnpmMatch) {
    throw new Error(`Cannot parse a pnpm version from packageManager "${packageManager}".`)
  }
  return `nodejs ${node}\npnpm ${pnpmMatch[1]}\n`
}
