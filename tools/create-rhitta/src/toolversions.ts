/**
 * Derive an asdf `.tool-versions` body from the project's single sources of truth:
 * `.nvmrc` (Node), `package.json`'s `packageManager` field (pnpm), and optionally
 * `.ruby-version` (Ruby — needed for iOS CocoaPods). Keeping this derived means no
 * second version file to drift in the Rhitta repo itself.
 */
export function deriveToolVersions(nvmrc: string, packageManager: string, ruby?: string): string {
  const node = nvmrc.trim().replace(/^v/, '')
  const pnpmMatch = /^pnpm@(.+)$/.exec(packageManager.trim())
  if (!pnpmMatch) {
    throw new Error(`Cannot parse a pnpm version from packageManager "${packageManager}".`)
  }
  let body = `nodejs ${node}\npnpm ${pnpmMatch[1]}\n`
  const rubyVersion = ruby?.trim().replace(/^ruby-?/, '')
  if (rubyVersion) {
    body += `ruby ${rubyVersion}\n`
  }
  return body
}
