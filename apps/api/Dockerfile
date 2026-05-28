# =============================================================================
# Rhitta API — production Docker base image
# =============================================================================
#
# WHAT THIS IS
# ------------
# This Dockerfile produces the *base layer* on top of which Encore.ts's CLI
# stitches the compiled application. The actual "build" is driven by
# `apps/api/scripts/build-docker.sh`, which:
#   1. Builds this base image (security-hardened Node 22 substrate).
#   2. Invokes `encore build docker rhitta-api --base <this-image>`, which
#      compiles the TypeScript service, generates the Encore runtime
#      bootstrap (handler registry + napi-backed event loop), and layers
#      the result on top of this base.
#
# WHY THIS SHAPE (Path A from Task 11)
# ------------------------------------
# Per ADR-0009 the API ships as a Docker image with no Encore Cloud
# dependency. Two implementation paths were considered:
#
#   Path A — Use `encore build docker` (chosen)
#     Encore.ts services are not free-standing Node processes. The
#     `encore.dev` SDK is metadata: services are declared with `new
#     Service()` and endpoints are declared with `api()`, but the actual
#     HTTP server, Pub/Sub broker, and request lifecycle live in a Rust
#     runtime bridged via napi (see
#     `encore.dev/internal/runtime/napi/napi.cjs`). The bootstrap that
#     registers handlers and calls `RT.runForever()` is *generated* by
#     `encore build docker` — there is no public entrypoint we can call
#     from a hand-written `main.ts`. Confirmed against encore.dev@1.57.5
#     source and https://encore.dev/docs/ts/self-host/build.
#
#   Path B — Hand-rolled `tsc` + `node dist/main.js` (rejected)
#     Would require reverse-engineering Encore's codegen to emit the
#     handler-registry bootstrap, which is unstable across patch versions
#     and not part of the public API. Brittle and unsupported.
#
# `encore build docker` produces a *complete image*, so we cannot nest it
# as a `RUN` step inside a multi-stage Dockerfile without docker-in-docker.
# Instead, the build script orchestrates two `docker build`-style calls:
# first this base, then Encore's CLI which uses `--base` to stack the
# compiled service on top. Result: one hardened image, no Encore Cloud,
# no Encore CLI required at runtime, no daemon-in-container required at
# build time.
#
# HARDENING APPLIED HERE
# ----------------------
# - `node:22.22.3-slim` matches `.nvmrc` exactly (Node 22.22.3).
# - Non-root user `app` (UID/GID 1001) — Encore's bootstrap is happy to
#   run unprivileged; only port 8080 is bound, which is unprivileged.
# - `tini` as PID 1 for proper SIGTERM forwarding and zombie reaping.
#   Encore.ts installs its own SIGINT/SIGTERM no-op handlers (see
#   `internal/appinit/mod.ts`) so the Rust runtime can drain gracefully;
#   tini ensures the signal actually reaches Node when the container is
#   stopped.
# - `dumb-init`-style entrypoint isn't needed because Encore's worker
#   threads + Rust runtime already manage child lifecycle.
# - No `apt` package leftovers (`--no-install-recommends`, cleanup).
# - `NODE_ENV=production` set so any libraries that branch on it use the
#   production code path.
# - Working directory `/app` is pre-owned by `app:app` so the Encore
#   layer (which copies compiled output as the last step) writes into a
#   pre-permissioned tree.
#
# BUILD
# -----
#   ./apps/api/scripts/build-docker.sh                     # full build
#   docker build -f apps/api/Dockerfile -t rhitta-api-base . # base only
#
# RUN
# ---
#   docker run --rm -p 8080:8080 \
#     -e DATABASE_URL=postgres://... \
#     -e BETTER_AUTH_SECRET=... \
#     rhitta-api
#
# The image listens on port 8080 by default (Encore.ts convention).
# Override with `-e PORT=NNNN -p NNNN:NNNN`.
# =============================================================================

# Pin the digest-free tag — Node 22.22.3 slim matches `.nvmrc`.
FROM node:22.22.3-slim AS base

# Install tini for proper PID 1 signal forwarding. Encore's runtime
# installs no-op SIGTERM handlers to keep in-flight requests alive while
# the Rust runtime drains; tini ensures Docker's stop signal reaches Node
# in the first place. ca-certificates is required for outbound TLS
# (Anthropic, Resend, S3, Neon).
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends tini ca-certificates; \
    rm -rf /var/lib/apt/lists/*

# Non-root user. UID/GID 1001 avoids collision with the default `node`
# user (UID 1000) so volume mounts from a host `node` user don't get
# silently re-permissioned. Not `--system` because Debian reserves
# UID < 1000 for system accounts.
RUN groupadd --gid 1001 app \
    && useradd --uid 1001 --gid app --create-home --shell /usr/sbin/nologin app

# Pre-create /app owned by app:app. Encore's CLI will copy compiled
# output (and its node_modules) into the working dir on top of this base.
WORKDIR /app
RUN chown app:app /app

# Production env defaults. `PORT` mirrors Encore's default; can be
# overridden at `docker run` time without rebuilding.
ENV NODE_ENV=production \
    PORT=8080

USER app

# Encore's compiled service binds 0.0.0.0:8080 by default.
EXPOSE 8080

# Healthcheck: hit Encore's auto-injected `/__encore/healthz`-style
# endpoint via the API service's notes module's read endpoint isn't safe
# (it needs auth). Use a lightweight TCP check instead — `node -e` keeps
# the dependency surface minimal (no `curl`/`wget` to maintain).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('net').connect({host:'127.0.0.1',port:Number(process.env.PORT||8080)},function(){process.exit(0)}).on('error',function(){process.exit(1)})"

# tini as PID 1. The Encore CLI's `build docker` step appends its own
# CMD (the generated bootstrap entrypoint). We keep ENTRYPOINT here so
# Encore's CMD is wrapped by tini without further configuration.
ENTRYPOINT ["/usr/bin/tini", "--"]

# Default CMD is a placeholder for the *base* image — Encore's CLI
# overrides this when it layers the compiled service. If someone runs
# this base image directly (e.g., for debugging), exit cleanly with a
# helpful message instead of dropping into a no-op container.
CMD ["node", "-e", "console.error('This is the rhitta-api base image. Run apps/api/scripts/build-docker.sh to produce the full rhitta-api image.'); process.exit(1)"]
