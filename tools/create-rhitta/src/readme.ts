import type { AppName, ScaffoldParams } from './types.js'

const APP_LABEL: Record<AppName, string> = { api: 'API', web: 'web', mobile: 'mobile' }

const DEV_COMMAND: Record<AppName, string> = {
  api: 'pnpm dev:api      # Encore — auto-provisions a local Postgres (Docker) + runs migrations',
  web: 'pnpm dev:web      # TanStack Start (Vite), points at the local API',
  mobile:
    'pnpm dev:mobile   # Expo — run `pnpm --filter @rhitta/mobile prebuild:clean` first for native iOS/Android',
}

const WORKSPACE_LINE: Record<AppName, string> = {
  api: '- `apps/api` — Encore.ts service (Postgres + Better Auth).',
  web: '- `apps/web` — TanStack Start SSR client.',
  mobile:
    '- `apps/mobile` — Expo / React Native app (run `pnpm --filter @rhitta/mobile prebuild:clean` to materialize native projects).',
}

export function renderReadme(p: ScaffoldParams): string {
  const appList = p.apps.map((a) => APP_LABEL[a]).join(' + ')
  const devCommands = p.apps.map((a) => DEV_COMMAND[a]).join('\n')
  const workspaceLines = [
    ...p.apps.map((a) => WORKSPACE_LINE[a]),
    '- `packages/*` — shared contracts, design tokens, and config.',
  ].join('\n')

  return `# ${p.appName}

Bootstrapped with [Rhitta](https://github.com/LeoRedin/rhitta) — an opinionated,
convention-enforced monorepo for ${appList}.

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
${devCommands}
\`\`\`

No manual database setup or connection strings: Encore owns the local Postgres and applies
the Drizzle migrations on \`dev:api\` startup.

## Workspaces

${workspaceLines}

## Conventions

The operating manual lives in [\`AGENTS.md\`](./AGENTS.md); architectural decisions in
[\`docs/adr/\`](./docs/adr/). The structure validator (\`pnpm structure:validate\`) enforces
them on every commit.
`
}
