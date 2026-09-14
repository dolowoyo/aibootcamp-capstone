# Observability

Owned by `platform-engineer` (Session 7). Covers what the platform provides for the app
to instrument itself with — not application feature code. The app worktree (`builder`)
is expected to add the actual `pino` dependency and call sites in `app/package.json` and
`app/` source, per the conventions below; this doc is the contract, written before that
code exists (Block 2 parallel build — see `docs/00-capstone-plan.md`).

## Structured logging — `pino`

**Dependency:** `pino` (plus `pino-http` for request-scoped child loggers in Next.js API
routes). Add to `app/package.json` — not added here, since `app/` isn't owned by this
worktree.

**Convention:**

- Every log line is JSON (pino's default), never `console.log`. This is what makes logs
  greppable/shippable to the otel-collector or any log aggregator later without a
  reformatting step.
- Every request gets a `requestId` — generate one (e.g. `crypto.randomUUID()`) at the
  edge of each API route / middleware, attach it to a child logger
  (`logger.child({ requestId })`), and pass that child logger down through the call, so
  every log line emitted while handling that request carries the same `requestId`. This
  is what makes "find every log line for this one diagnosis request" possible.
- Minimum fields on every log line: `level`, `time`, `requestId`, `msg`. Inference-path
  logs (see below) additionally carry `provider` (`fixture`/`sidecar`/`anthropic`) and
  `durationMs`.
- Never log the raw intake narrative or any fixture/fabricated PII-shaped field at `info`
  level — log its length/hash if you need to correlate, not its content. (No real data
  exists in this repo per constitution principle VII, but the logging convention should
  hold regardless of whether the data is fabricated.)

## OpenTelemetry tracing — the inference path specifically

**Why the inference path and not everything:** latency per diagnosis is the one metric
in this app that's actually demoable and actually varies meaningfully by adapter
(`fixture` is near-instant; `sidecar` involves a real Agent SDK round trip). Instrumenting
the whole app uniformly would dilute that signal; instrumenting the inference boundary
specifically makes it a clean, camera-ready number.

**Instrumentation points** (named here because `lib/inference/` doesn't exist in this
worktree yet — these are the exact seams to wrap once it does, per
`docs/plans/PLAN-000-inference-provider-contract.md`'s module layout):

1. `lib/inference/provider-factory.ts` → `createProvider()` — wrap the returned
   provider's `diagnoseStars`/`generatePlan` calls in a span each:
   - Span name: `inference.diagnoseStars` / `inference.generatePlan`.
   - Attributes: `provider` (`fixture`/`sidecar`/`anthropic`), `outcome`
     (`success`/`schema_validation_error`/`provider_unavailable`/`provider_configuration_error`
     — the four outcomes SPEC-000's error contract, AC-0.2/0.3/0.9/0.10/0.11, already
     defines).
   - This is the single seam that captures every adapter uniformly, since PLAN-000 routes
     all adapters through the same `validateAgainstSchema()` call — instrumenting at the
     factory boundary means adapter-specific instrumentation is never needed.
2. `lib/inference/adapters/sidecar.ts` → the `fetch()` call to
   `http://host.docker.internal:8787` — a child span (`inference.sidecar.http`) around
   the HTTP round trip specifically, so a slow Agent SDK cold-start (ADR-0001's known
   30s-timeout risk) is visible as its own span duration, distinguishable from
   schema-validation time.
3. Both spans record `durationMs` as an attribute *and* rely on OTel's own span duration —
   the attribute makes it grep-able in the collector's `debug` exporter output without
   needing a full tracing backend (see `otel-collector-config.yaml` — no external backend
   is wired up, per `docs/adr/0003-local-iac.md`'s no-cloud-account constraint).

**SDK wiring (for whoever adds `lib/inference/` instrumentation):**
- `@opentelemetry/sdk-node` + `@opentelemetry/exporter-trace-otlp-http`, initialized once
  at process start (e.g. `instrumentation.ts`, Next.js's documented convention for
  `register()` in `next.config`), pointed at `OTEL_EXPORTER_OTLP_ENDPOINT`
  (`http://otel-collector:4318` in `docker-compose.yml`, unset/no-op locally outside
  Docker).
- Manual spans via `trace.getTracer('first90-inference')` at the two points above — this
  app's inference call volume is low enough (one diagnosis, one plan per user session)
  that auto-instrumentation of the whole HTTP stack isn't needed to get the one metric
  that matters.

## Health endpoints

- **`/api/healthz`** — liveness only: process is up, can respond to HTTP. No dependency
  checks (DB, sidecar). This is what `Dockerfile`'s `HEALTHCHECK` and
  `docker-compose.yml`'s `app` healthcheck both poll.
- **`/api/readyz`** — readiness: additionally confirms the Postgres connection is live
  (a real query, e.g. `SELECT 1`, not just "did Prisma construct a client"). Does **not**
  check the inference sidecar — a demo running in `fixture` mode is fully ready with no
  sidecar running at all, and `readyz` failing whenever the sidecar happens to be down
  would make the "fixture is the safe on-camera fallback" story (ADR-0001) untrue in
  practice.
- Both return `200` with a small JSON body (`{ "status": "ok" }` or similar) on success,
  and a non-2xx on failure — this is the exact contract `docs/00-capstone-plan.md`'s
  verification step 6 (`docker compose up --build` ... `/api/healthz` and `/api/readyz`
  return 200) checks against.

## What's deferred to Block 3

None of the above can be code-verified in this worktree — `app/`, `lib/inference/`, and
`services/inference-sidecar/` don't exist here (parallel Block 2 build). What's verified
now: the `otel-collector` service starts for real and accepts OTLP traces/logs on
4317/4318 (see PR description). What's deferred: actually emitting a span from real
`lib/inference/` code, and confirming `/api/healthz`/`/api/readyz` return 200 from a real
Next.js route.
