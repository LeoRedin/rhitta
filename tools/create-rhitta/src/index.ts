#!/usr/bin/env node
import { log } from '@clack/prompts'
import { finalize } from './post.js'
import { collectParams, parseFlags } from './prompts.js'
import { rewriteIdentifiers } from './rewrite.js'
import { resolveSource } from './source.js'
import { applyStripList } from './strip.js'

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2))
  const params = await collectParams(flags)

  const tree = await resolveSource({ from: flags.from, ref: flags.ref })
  applyStripList(tree)
  rewriteIdentifiers(tree, params)
  const target = finalize(tree, params, { install: flags.install, git: flags.git })

  log.success(`Created ${params.appName} at ${target}`)
  log.info(
    'Next: cd in, then `pnpm validate`. For mobile native projects run `pnpm --filter @rhitta/mobile prebuild:clean`.'
  )
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`create-rhitta failed: ${msg}`)
  process.exit(1)
})
