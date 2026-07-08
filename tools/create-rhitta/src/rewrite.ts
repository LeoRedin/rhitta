import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ScaffoldParams } from './types.js'

/** Read JSON, mutate via fn, write back with 2-space indent + trailing newline. */
function editJson(path: string, fn: (json: Record<string, unknown>) => void): void {
  const json = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  fn(json)
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`)
}

/** Replace the FIRST occurrence of `needle` with `value` in a text file. */
function replaceOnce(path: string, needle: string, value: string): void {
  const text = readFileSync(path, 'utf8')
  const idx = text.indexOf(needle)
  if (idx === -1) {
    throw new Error(`Expected to find "${needle}" in ${path} but did not.`)
  }
  writeFileSync(path, text.slice(0, idx) + value + text.slice(idx + needle.length))
}

export function rewriteIdentifiers(root: string, p: ScaffoldParams): void {
  editJson(join(root, 'package.json'), (j) => {
    j.name = p.slug
  })

  editJson(join(root, 'apps/api/encore.app'), (j) => {
    j.id = p.encoreId
  })

  replaceOnce(join(root, 'apps/api/.env.example'), 'S3_BUCKET=rhitta', `S3_BUCKET=${p.slug}`)

  // app.json is rewritten via targeted string replacement rather than JSON
  // re-serialization: re-serializing expands short arrays like
  // `"assetBundlePatterns": ["**/*"]` to multi-line, which Biome's formatter then
  // rejects — making a fresh scaffold fail `pnpm lint` until the user runs
  // `pnpm format`. Editing values in place keeps the file's Biome-clean formatting.
  // `JSON.stringify(value)` yields a properly quoted+escaped JSON string literal.
  const appJson = join(root, 'apps/mobile/app.json')
  replaceOnce(appJson, '"name": "mobile"', `"name": ${JSON.stringify(p.appName)}`)
  replaceOnce(appJson, '"slug": "mobile"', `"slug": ${JSON.stringify(p.slug)}`)
  replaceOnce(appJson, '"scheme": "rhitta"', `"scheme": ${JSON.stringify(p.scheme)}`)
  replaceOnce(appJson, '"package": "com.rhitta.app"', `"package": ${JSON.stringify(p.bundleId)}`)
  replaceOnce(
    appJson,
    '"bundleIdentifier": "com.rhitta.app"',
    `"bundleIdentifier": ${JSON.stringify(p.bundleId)}`
  )

  editJson(join(root, 'apps/mobile/package.json'), (j) => {
    const scripts = j.scripts as Record<string, string> | undefined
    if (scripts?.['test:maestro']) {
      scripts['test:maestro'] = scripts['test:maestro'].replace(
        'MAESTRO_APP_ID=com.rhitta.app',
        `MAESTRO_APP_ID=${p.bundleId}`
      )
    }
  })

  for (const rel of [
    'apps/mobile/scripts/gen-api-client.sh',
    'apps/web/scripts/gen-api-client.sh',
  ]) {
    replaceOnce(join(root, rel), 'APP_ID="rhitta"', `APP_ID="${p.encoreId}"`)
  }
}
