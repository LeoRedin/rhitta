#!/usr/bin/env node
import { log } from '@clack/prompts'
import { finalize } from './post.js'
import { collectParams, parseFlags } from './prompts.js'
import { pruneApps } from './prune.js'
import { rewriteIdentifiers } from './rewrite.js'
import { resolveSource } from './source.js'
import { applyStripList } from './strip.js'

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2))
  const params = await collectParams(flags)

  const tree = await resolveSource({ from: flags.from, ref: flags.ref })
  applyStripList(tree)
  // Prune deselected apps before rewriting ids so the rewrite only touches kept apps.
  pruneApps(tree, params.apps)
  rewriteIdentifiers(tree, params)
  const target = finalize(tree, params, { install: flags.install, git: flags.git })

  const mobileNote = params.apps.includes('mobile')
    ? ' For mobile native projects run `pnpm --filter @rhitta/mobile prebuild:clean`.'
    : ''
  log.success(`Created ${params.appName} (${params.apps.join(', ')}) at ${target}`)
  log.info(
    (flags.install
      ? 'Next: `cd` in, then `pnpm validate`.'
      : 'Next: `cd` in, then `pnpm install && pnpm build`, then `pnpm validate`.') + mobileNote
  )
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`create-rhitta failed: ${msg}`)
  process.exit(1)
})
