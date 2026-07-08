import { cancel, confirm, intro, isCancel, multiselect, note, outro, text } from '@clack/prompts'
import { buildParams, isAppName, isValidBundleId, normalizeApps } from './params.js'
import { ALL_APPS, type AppName, type RawFlags, type ScaffoldParams } from './types.js'

/** Parse a `--apps a,b,c` value into validated AppNames. Throws on an unknown token. */
function parseAppsList(value: string): AppName[] {
  const tokens = value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
  const apps: AppName[] = []
  for (const token of tokens) {
    if (!isAppName(token)) {
      throw new Error(`Unknown app "${token}" in --apps. Valid apps: ${ALL_APPS.join(', ')}.`)
    }
    apps.push(token)
  }
  return apps
}

/** Parse argv (after `node index.js`) into RawFlags. First non-flag arg is the dir. */
export function parseFlags(argv: string[]): RawFlags {
  const flags: RawFlags = { install: true, git: true }
  let appsAllow: AppName[] | undefined
  const excluded = new Set<AppName>()
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
    } else if (a === '--no-web') {
      excluded.add('web')
    } else if (a === '--no-mobile') {
      excluded.add('mobile')
    } else if (a === '--apps' && i + 1 < argv.length) {
      appsAllow = parseAppsList(argv[i + 1] as string)
      i++
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
  // Resolve app selection from flags. Leaving `flags.apps` undefined (no --apps and no
  // --no-* flag) is the signal to prompt for it interactively. `api` is always included.
  if (appsAllow !== undefined || excluded.size > 0) {
    const base = appsAllow ?? [...ALL_APPS]
    flags.apps = normalizeApps(base.filter((app) => !excluded.has(app)))
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

/** Interactive multiselect for app inclusion. `api` is forced on regardless of toggles. */
async function promptApps(): Promise<AppName[]> {
  const selected = exitIfCancel(
    await multiselect<AppName>({
      message: 'Which apps to include? (api is always included)',
      options: [
        { value: 'api', label: 'api', hint: 'Encore.ts backend — required' },
        { value: 'web', label: 'web', hint: 'TanStack Start SSR client' },
        { value: 'mobile', label: 'mobile', hint: 'Expo / React Native app' },
      ],
      initialValues: [...ALL_APPS],
      required: false,
    })
  )
  return normalizeApps(selected)
}

/** Fill any missing fields interactively, then build validated ScaffoldParams. */
export async function collectParams(flags: RawFlags): Promise<ScaffoldParams> {
  intro('create-rhitta')
  // Interactive when the caller did not pin the app selection via flags.
  const interactive = flags.apps === undefined

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

  const apps = flags.apps ?? (await promptApps())

  // The bundle id only feeds the mobile app.json — prompt for it only when mobile is in.
  let bundleId = flags.bundleId ?? ''
  if (apps.includes('mobile') && flags.bundleId === undefined) {
    bundleId = exitIfCancel(
      await text({
        message: 'Mobile bundle id (reverse-DNS)?',
        placeholder: 'com.acme.app',
        validate: (v) => (isValidBundleId(v) ? undefined : 'Use reverse-DNS, e.g. com.acme.app'),
      })
    )
  }

  if (interactive) {
    const summary = [
      `Directory:  ${dir}`,
      `Name:       ${name}`,
      `Apps:       ${apps.join(', ')}`,
      ...(apps.includes('mobile') ? [`Bundle id:  ${bundleId}`] : []),
    ].join('\n')
    note(summary, 'Scaffold summary')
    const ok = exitIfCancel(await confirm({ message: 'Scaffold with these settings?' }))
    if (!ok) {
      cancel('Scaffolding cancelled.')
      process.exit(1)
    }
  }

  outro('Scaffolding…')
  return buildParams({ dir, name, bundleId, apps })
}
