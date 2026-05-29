import type { ScaffoldParams } from './types.js'

export function renderReadme(p: ScaffoldParams): string {
  return `# ${p.appName}

Bootstrapped with [Rhitta](https://github.com/LeoRedin/rhitta) — an opinionated,
convention-enforced monorepo for API + web + mobile.

## Setup

\`\`\`bash
nvm use
corepack enable
pnpm install
pnpm build      # build shared packages (they export from dist/)
pnpm validate   # lint + typecheck + structure validation
\`\`\`

## Workspaces

- \`apps/api\` — Encore.ts service (Postgres + Better Auth).
- \`apps/web\` — TanStack Start SSR client.
- \`apps/mobile\` — Expo / React Native app (run \`pnpm --filter @rhitta/mobile prebuild:clean\` to materialize native projects).
- \`packages/*\` — shared contracts, design tokens, and config.

## Conventions

The operating manual lives in [\`AGENTS.md\`](./AGENTS.md); architectural decisions in
[\`docs/adr/\`](./docs/adr/). The structure validator (\`pnpm structure:validate\`) enforces
them on every commit.
`
}
