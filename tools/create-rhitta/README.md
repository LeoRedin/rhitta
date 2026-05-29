# create-rhitta

Scaffold a new [Rhitta](https://github.com/LeoRedin/rhitta) project.

```bash
npm create rhitta@latest my-app
# or: pnpm create rhitta my-app
# or: npx create-rhitta my-app
```

The CLI vendors the full Rhitta monorepo (api + web + mobile + packages + tools),
rewrites the project identifiers you provide, and leaves you a ready-to-build workspace.

## Flags

| Flag | Meaning |
|------|---------|
| `<dir>` | Target directory (positional). Prompted if omitted. |
| `--name <s>` | App display name. |
| `--bundle-id <s>` | Mobile reverse-DNS bundle id (e.g. `com.acme.app`). |
| `--from <path>` | Vendor from a local Rhitta checkout instead of GitHub (testing). |
| `--ref <git-ref>` | GitHub ref/tag to vendor from (default: latest release). |
| `--no-install` | Skip dependency install. |
| `--no-git` | Skip `git init`. |
