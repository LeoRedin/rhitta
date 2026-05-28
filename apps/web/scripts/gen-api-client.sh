#!/usr/bin/env bash
# =============================================================================
# gen-api-client.sh — regenerate the typed Encore client for apps/web.
# =============================================================================
#
# Per ADR-0020, `apps/web` consumes `apps/api` exclusively via the
# Encore-generated TypeScript client SDK. This script is the canonical
# regeneration entrypoint:
#
#   pnpm --filter @rhitta/web gen:api-client
#
# Mechanics:
#   1. Locate the Encore CLI. Preference order:
#        a. Host-installed `encore` on $PATH.
#        b. Workspace-local install at $REPO_ROOT/.encore/bin/encore
#           (installed by apps/api/scripts/build-docker.sh on first run).
#   2. Invoke `encore gen client` against the `rhitta` app (see encore.app),
#      writing TypeScript output to apps/web/src/lib/api-client/api-client.ts.
#
# Notes:
#   - Encore 1.57.5's `gen client` for the default `--env=local` requires the
#     app to have been run at least once locally (it reads the analyzer's
#     metadata snapshot). If you see "the app rhitta must be run locally
#     before generating a client", run `pnpm --filter @rhitta/api dev`
#     once (which calls `encore run`) then re-run this script.
#   - The generated file is committed to the repo. CI re-runs this script
#     and fails if the checked-in output differs from the regenerated
#     version (see .github/workflows/ci.yml).
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

API_DIR="${REPO_ROOT}/apps/api"
OUTPUT="${REPO_ROOT}/apps/web/src/lib/api-client/api-client.ts"
APP_ID="rhitta"

# Locate the Encore CLI. Match apps/api/scripts/build-docker.sh's resolution
# order so a single workspace-local install serves both build and codegen.
if command -v encore >/dev/null 2>&1; then
    ENCORE_BIN="$(command -v encore)"
elif [[ -x "${REPO_ROOT}/.encore/bin/encore" ]]; then
    ENCORE_BIN="${REPO_ROOT}/.encore/bin/encore"
else
    echo "Encore CLI not found." >&2
    echo "Either install Encore globally (curl -fsSL https://encore.dev/install.sh | bash)" >&2
    echo "or run apps/api/scripts/build-docker.sh once to install it into ${REPO_ROOT}/.encore/." >&2
    exit 1
fi

echo "==> Using Encore CLI: ${ENCORE_BIN}"
echo "==> Regenerating ${OUTPUT}"

# `gen client` resolves the app via the encore.app manifest in the cwd.
cd "${API_DIR}"
"${ENCORE_BIN}" gen client "${APP_ID}" \
    --output "${OUTPUT}" \
    --lang typescript

echo "==> Generated: ${OUTPUT}"
