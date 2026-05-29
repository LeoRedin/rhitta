import { cancel, confirm, intro, isCancel, outro, text } from '@clack/prompts'
import { buildParams, isValidBundleId } from './params.js'
import type { RawFlags, ScaffoldParams } from './types.js'

/** Parse argv (after `node index.js`) into RawFlags. First non-flag arg is the dir. */
export function parseFlags(argv: string[]): RawFlags {
  const flags: RawFlags = { install: true, git: true }
  let i = 0
  while (i < argv.length) {
    const a = argv[i]
    if (a === undefined) {
      i++
      continue
    }
    if (a === '--no-install') {
      flags.install = false
    } else if (a === '--no-git') {
      flags.git = false
    } else if (a === '--name' && i + 1 < argv.length) {
      flags.name = argv[i + 1]
      i++
    } else if (a === '--bundle-id' && i + 1 < argv.length) {
      flags.bundleId = argv[i + 1]
      i++
    } else if (a === '--from' && i + 1 < argv.length) {
      flags.from = argv[i + 1]
      i++
    } else if (a === '--ref' && i + 1 < argv.length) {
      flags.ref = argv[i + 1]
      i++
    } else if (!a.startsWith('-') && flags.dir === undefined) {
      flags.dir = a
    }
    i++
  }
  return flags
}

function exitIfCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Scaffolding cancelled.')
    process.exit(1)
  }
  return value as T
}

/** Fill any missing fields interactively, then build validated ScaffoldParams. */
export async function collectParams(flags: RawFlags): Promise<ScaffoldParams> {
  intro('create-rhitta')

  const dir =
    flags.dir ??
    exitIfCancel(
      await text({
        message: 'Project directory?',
        placeholder: 'my-app',
        validate: (v) => (v.trim().length === 0 ? 'Required' : undefined),
      })
    )

  const name =
    flags.name ??
    exitIfCancel(
      await text({
        message: 'App display name?',
        placeholder: dir,
        defaultValue: dir,
      })
    )

  const bundleId =
    flags.bundleId ??
    exitIfCancel(
      await text({
        message: 'Mobile bundle id (reverse-DNS)?',
        placeholder: 'com.acme.app',
        validate: (v) => (isValidBundleId(v) ? undefined : 'Use reverse-DNS, e.g. com.acme.app'),
      })
    )

  outro('Scaffolding…')
  return buildParams({ dir, name, bundleId })
}

export async function confirmInstall(): Promise<boolean> {
  const ok = await confirm({ message: 'Install dependencies now?' })
  return exitIfCancel(ok)
}
