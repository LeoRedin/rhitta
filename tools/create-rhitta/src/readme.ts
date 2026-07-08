import type { ScaffoldParams } from './types.js'

export function renderReadme(p: ScaffoldParams): string {
  return `# ${p.appName}

Bootstrapped with [Rhitta](https://github.com/LeoRedin/rhitta) — an opinionated,
convention-enforced monorepo for API + web + mobile.

## Setup

Toolchain versions are pinned in \`.tool-versions\` (Node, pnpm, Ruby), derived from
\`.nvmrc\` + \`packageManager\`. The pinned Node patch is a real published release; if
\`asdf install\` reports it as not found, your plugin index is stale — run
\`asdf plugin update nodejs\` (and \`asdf plugin update ruby\`) first.

\`\`\`bash
# asdf users — installs the pinned Node, pnpm, and Ruby (Ruby is needed for iOS CocoaPods):
asdf install
# or, with nvm + corepack instead of asdf:
nvm use && corepack enable

pnpm install
pnpm build      # build shared packages (they export from dist/)
pnpm validate   # lint + typecheck + structure validation
\`\`\`

## Run locally

Prerequisites:

- **Docker** running — the API's database is provisioned automatically by Encore.
- **Encore CLI** — \`curl -fsSL https://encore.dev/install.sh | bash\`.

\`.env\` files are pre-created for you from each app's \`.env.example\` (with a generated
dev auth secret). Optional integrations (Anthropic, Resend, S3) fall back to in-memory
adapters when their keys are blank, so everything runs with no extra setup — drop in real
keys in \`apps/api/.env\` when you want them.

\`\`\`bash
pnpm dev:api      # Encore — auto-provisions a local Postgres (Docker) + runs migrations
pnpm dev:web      # TanStack Start (Vite), points at the local API
pnpm dev:mobile   # Expo — run \`pnpm --filter @rhitta/mobile prebuild:clean\` first for native iOS/Android
\`\`\`

No manual database setup or connection strings: Encore owns the local Postgres and applies
the Drizzle migrations on \`dev:api\` startup.

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
