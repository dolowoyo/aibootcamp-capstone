# syntax=docker/dockerfile:1

# First 90 — Next.js 15 App Router, multi-stage, non-root runtime.
#
# Assumes app/next.config.{js,mjs,ts} sets `output: "standalone"` (owned by the app
# worktree — see docs/adr/0001-inference-boundary.md and docs/00-capstone-plan.md's
# repository layout). Standalone output is what lets the runtime stage ship without a
# full node_modules tree: `next build` traces the production dependency graph itself
# into `.next/standalone/`.
#
# This file cannot be fully build-verified in this worktree — app/ does not exist here
# yet (parallel Block 2 build, see the PR description for what's deferred to Block 3).
# It is written to the documented Next.js standalone-output contract, not against code
# this worktree can see.

ARG NODE_VERSION=20-alpine

# ---- deps: install workspace dependencies once, cached across builds ------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo

# Root workspace manifest + the app workspace's own manifest, so `npm ci` resolves the
# same dependency graph the monorepo actually uses (see root package.json's
# `workspaces` field: "app", "services/*", "mcp/*").
COPY package.json package-lock.json ./
COPY app/package.json ./app/package.json
RUN npm ci --workspace app --include-workspace-root

# ---- builder: compile the Next.js app --------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /repo

# npm workspaces hoists dependencies to the root node_modules/ -- app/node_modules is not
# a real, copyable dependency tree (confirmed empty except a stray .vite cache dir during
# Block 2 integration; see docs/decision-log.md). Copying only the root is correct here.
COPY --from=deps /repo/node_modules ./node_modules
COPY . .

# Tests/CI never call live inference — see docs/adr/0002-fixture-first-testing.md. The
# container build itself doesn't run tests, but the build-time default keeps a build run
# outside CI honest about the same guarantee.
ENV LLM_PROVIDER=fixture
ENV NEXT_TELEMETRY_DISABLED=1

# Generate the Prisma client before building. `npm ci` alone doesn't do this -- there's no
# postinstall hook wiring it up, only the manual `prisma:generate` script (app/package.json)
# -- so without this step `next build`'s standalone output traces a @prisma/client that was
# never generated, and the runtime fails with "did not initialize yet" the moment any route
# (e.g. /api/readyz) actually imports it. Found by running the built image for real.
RUN npx prisma generate --schema=./app/prisma/schema.prisma

RUN npm run build --workspace app

# ---- runner: minimal, non-root production image ---------------------------------------
FROM node:${NODE_VERSION} AS runner
# Must match the builder stage's WORKDIR (/repo), not just its own convenience path. Some
# server-side code resolves data files at runtime via `__dirname`-relative math (e.g.
# lib/inference/adapters/fixture.ts's fixtures/ lookup); Next's file tracer copies those
# files into the standalone output preserving their path *relative* to the monorepo root,
# but doesn't rewrite the compiled bundle's own idea of its absolute location -- that stays
# frozen to wherever `next build` ran (the builder stage's /repo). If the runner stage's
# WORKDIR differs, the copied files are relatively correct but sit under the wrong absolute
# prefix, so a runtime `__dirname`-based lookup ENOENTs on the build-time path. Found by
# running the built image for real: /api/diagnosis failed with "ENOENT: no such file or
# directory, scandir '/repo/fixtures/inference/stars'" even though the equivalent files were
# actually present at /app/fixtures/inference/stars under the old (mismatched) WORKDIR.
WORKDIR /repo

# The runner never invokes npm/npx/corepack at runtime (CMD below runs the standalone
# server.js directly), but node:${NODE_VERSION}'s base layer still ships all three --
# npm bundles its own tar/sigstore dependencies (used for npm install's own package
# fetching/provenance verification, never exercised here), and those showed up as
# real CRITICAL/HIGH CVEs in publish.yml's Trivy scan (unreachable at runtime, but
# still present in the shipped image, so still a real finding). Removing them outright
# is more correct than chasing a patched npm version -- this image doesn't need npm at
# all, matching this stage's own "minimal, non-root production image" design goal.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# node:${NODE_VERSION}'s OS package snapshot can lag Alpine's own security-patch branch
# between image-layer cache refreshes -- found via Trivy flagging libcrypto3/libssl3 CVEs
# fixed in Alpine's own repo but not yet in the cached base layer. Explicit apk upgrade
# pulls the current index rather than relying on whenever the base image was last built.
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Default in-container provider is `fixture` — the published image must be runnable by
# anyone with no credentials of any kind (docs/adr/0003-local-iac.md). Override to
# `sidecar` only when running against a host-side inference-sidecar process reachable at
# host.docker.internal (see docker-compose.yml / infra/terraform).
ENV LLM_PROVIDER=fixture

# Non-root runtime user. `node:alpine` already ships a `node` user/group (uid/gid 1000);
# reuse it rather than inventing a new one.
RUN mkdir -p /repo/app/.next && chown -R node:node /repo

# Standalone output contract: `.next/standalone` contains a self-executing `server.js`
# plus a pruned node_modules; `.next/static` and `public/` are not included in
# `standalone` and must be copied alongside it explicitly. See:
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
#
# IMPORTANT: because `outputFileTracingRoot` (app/next.config.ts) points at the monorepo
# root one level above `app/`, standalone output preserves that relative path -- server.js
# lands at `standalone/app/server.js`, NOT flatly at `standalone/server.js`. Confirmed by
# actually running the built image during Block 2 integration (it failed with
# MODULE_NOT_FOUND on a flat `server.js` path before this was found); see
# docs/decision-log.md. Static assets and public/ are copied to match that same nesting.
COPY --from=builder --chown=node:node /repo/app/.next/standalone ./
COPY --from=builder --chown=node:node /repo/app/.next/static ./app/.next/static
COPY --from=builder --chown=node:node /repo/app/public ./app/public

USER node

EXPOSE 3000

# /api/healthz is the liveness contract this image commits to (see
# docs/00-capstone-plan.md's platform-engineering section and docs/observability.md).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+ (process.env.PORT||3000) +'/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "app/server.js"]
