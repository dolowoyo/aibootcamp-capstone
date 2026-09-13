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

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/app/node_modules ./app/node_modules
COPY . .

# Tests/CI never call live inference — see docs/adr/0002-fixture-first-testing.md. The
# container build itself doesn't run tests, but the build-time default keeps a build run
# outside CI honest about the same guarantee.
ENV LLM_PROVIDER=fixture
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace app

# ---- runner: minimal, non-root production image ---------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

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
RUN mkdir -p /app/.next && chown -R node:node /app

# Standalone output contract: `.next/standalone` contains a self-executing `server.js`
# plus a pruned node_modules; `.next/static` and `public/` are not included in
# `standalone` and must be copied alongside it explicitly. See:
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
COPY --from=builder --chown=node:node /repo/app/.next/standalone ./
COPY --from=builder --chown=node:node /repo/app/.next/static ./.next/static
COPY --from=builder --chown=node:node /repo/app/public ./public

USER node

EXPOSE 3000

# /api/healthz is the liveness contract this image commits to (see
# docs/00-capstone-plan.md's platform-engineering section and docs/observability.md).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+ (process.env.PORT||3000) +'/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]
