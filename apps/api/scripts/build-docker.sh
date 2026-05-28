#!/usr/bin/env bash
# =============================================================================
# build-docker.sh — produce the rhitta-api production image.
# =============================================================================
#
# Two-step build:
#   1. Build the hardened base image from apps/api/Dockerfile (non-root user,
#      tini PID 1, Node 22.22.3-slim, port 8080).
#   2. Invoke `encore build docker` with --base pointing at our base image.
#      Encore's CLI compiles the TypeScript service, generates the runtime
#      bootstrap, bundles node_modules, and layers everything on top of the
#      base in a single `docker save`-style step.
#
# Why a script instead of a one-shot Dockerfile:
#   `encore build docker` produces a complete image (not extractable build
#   artifacts), so it cannot be nested inside a multi-stage Dockerfile
#   without docker-in-docker. The script is the explicit orchestration
#   seam. See apps/api/Dockerfile header for the full rationale.
#
# Requirements:
#   - Docker daemon reachable from the host running this script.
#   - Network access to download the Encore CLI on first run.
#   - `pnpm install --frozen-lockfile` already executed at repo root (the
#     Encore CLI needs node_modules to introspect Service definitions).
#
# Usage:
#   ./apps/api/scripts/build-docker.sh                       # tag :latest
#   IMAGE_TAG=v1.2.3 ./apps/api/scripts/build-docker.sh      # custom tag
#   ENCORE_VERSION=1.57.5 ./apps/api/scripts/build-docker.sh # pin CLI ver
#
# CI integration: this script is the canonical entrypoint. CI does NOT
# need the Encore CLI pre-installed on the runner; the script installs it
# into a workspace-local prefix (./.encore) and uses it in-place.
# =============================================================================

set -euo pipefail

# Resolve repo root regardless of where the script is invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

IMAGE_NAME="${IMAGE_NAME:-rhitta-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BASE_IMAGE_NAME="${BASE_IMAGE_NAME:-rhitta-api-base}"
BASE_IMAGE_TAG="${BASE_IMAGE_TAG:-latest}"
ENCORE_VERSION="${ENCORE_VERSION:-1.57.5}"

cd "${REPO_ROOT}"

echo "==> Building base image: ${BASE_IMAGE_NAME}:${BASE_IMAGE_TAG}"
docker build \
    --file apps/api/Dockerfile \
    --tag "${BASE_IMAGE_NAME}:${BASE_IMAGE_TAG}" \
    .

# Locate or install the Encore CLI. Prefer a host-installed version (so
# developers don't re-download on every build), fall back to a workspace-
# local install for CI / fresh checkouts.
if command -v encore >/dev/null 2>&1; then
    ENCORE_BIN="$(command -v encore)"
    echo "==> Using host-installed Encore CLI: ${ENCORE_BIN}"
else
    ENCORE_INSTALL="${REPO_ROOT}/.encore"
    ENCORE_BIN="${ENCORE_INSTALL}/bin/encore"
    if [[ ! -x "${ENCORE_BIN}" ]]; then
        echo "==> Installing Encore CLI ${ENCORE_VERSION} into ${ENCORE_INSTALL}"
        ENCORE_INSTALL="${ENCORE_INSTALL}" \
            bash -c "curl -fsSL https://encore.dev/install.sh | bash -s -- ${ENCORE_VERSION}"
    else
        echo "==> Using workspace-local Encore CLI: ${ENCORE_BIN}"
    fi
fi

echo "==> Building application image: ${IMAGE_NAME}:${IMAGE_TAG}"
cd "${REPO_ROOT}/apps/api"
"${ENCORE_BIN}" build docker \
    --base "${BASE_IMAGE_NAME}:${BASE_IMAGE_TAG}" \
    "${IMAGE_NAME}:${IMAGE_TAG}"

echo "==> Done. Run with:"
echo "    docker run --rm -p 8080:8080 -e DATABASE_URL=... ${IMAGE_NAME}:${IMAGE_TAG}"
