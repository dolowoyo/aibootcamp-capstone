# `services/inference-sidecar`

Host-side process that owns the Claude Agent SDK, per
`docs/adr/0001-inference-boundary.md`. The containerized app never runs this process itself;
it talks to it over HTTP at `http://host.docker.internal:8787` (per
`docs/00-capstone-plan.md`'s architecture diagram and ADR-0001).

## Why this exists

The Agent SDK authenticates by spawning the `claude` CLI, which reads credentials from the
macOS keychain -- neither exists inside a Docker container. This process runs on the host,
where both do, and exposes a small HTTP surface the containerized app's `lib/inference/
adapters/sidecar.ts` calls instead of importing the SDK directly.

## HTTP contract

**There is no contract doc for this wire shape analogous to `docs/mcp-tool-contract.md`** --
SPEC-000/PLAN-000 define the *`InferenceProvider` interface* (`diagnoseStars`/`generatePlan`)
that `sidecar.ts` implements, but not the HTTP wire shape between `sidecar.ts` and this
process, since that's this task's (TASKS-000 Task 9) own design surface. This README is
therefore the source of truth for it. If it needs to change, update this file in the same
commit and flag it -- same reconciliation discipline as the MCP contract doc.

Two routes, mirroring the two `InferenceProvider` operations:

### `POST /diagnose`

Backs `sidecar.ts`'s `diagnoseStars(intake)`.

**Request body:**
```json
{ "prompt": "string -- built by sidecar.ts from the intake + task instructions",
  "schema": { "...": "JSON Schema for the expected StarsDiagnosis shape" } }
```

**Response `200`:** `{ "result": <object matching schema> }`
**Response `400`:** `{ "error": "invalid_request" | "invalid_json", "message": string }`
**Response `502`:** `{ "error": "agent_error", "message": string }` -- the Agent SDK turn
ended in an error result, or ended without ever producing `structured_output`.
**Response `504`:** `{ "error": "timeout", "message": string }` -- no result within 30s.

### `POST /plan`

Backs `sidecar.ts`'s `generatePlan(diagnosis)`. Identical request/response shape to
`/diagnose` above -- same `{ prompt, schema }` in, same `{ result }` / error shape out. The
two routes exist as named endpoints (rather than one generic one) so logs/metrics can
distinguish which `InferenceProvider` operation a request came from.

### Why `{ prompt, schema }` rather than `{ intake }` / `{ diagnosis }` directly

This process is intentionally domain-ignorant: it doesn't import or know about
`StarsDiagnosis` or the milestone schema (those are SPEC-001/SPEC-002 deliverables owned in
`lib/inference/schemas/`, a different workspace). `sidecar.ts` already has the Zod schema and
the domain context to build both the prompt and a JSON Schema from it, so this process's only
job (per ADR-0001) is: take a prompt and a JSON Schema, run the Agent SDK's `query()` with
`outputFormat: { type: 'json_schema', schema }`, enforce a 30s timeout, and hand back
whatever `structured_output` comes back. The caller (`lib/inference/validate.ts`, per
PLAN-000) Zod-validates the result again regardless -- a schema-constrained LLM response is
still untrusted input.

## Error-code mapping (HTTP status → sidecar.ts's expected outcome)

| HTTP status | Meaning | `sidecar.ts` should map to |
|---|---|---|
| `200` | success | resolve with `body.result` |
| `400` | malformed request (shouldn't happen if `sidecar.ts` is correct) | treat as a bug, not a runtime error class |
| `502` | Agent SDK turn failed | `ProviderUnavailableError` (SPEC-000 AC-0.10) |
| `504` | Agent SDK turn exceeded 30s | `ProviderUnavailableError` (SPEC-000 AC-0.10) |
| connection refused / network error | process not running | `ProviderUnavailableError` (SPEC-000 AC-0.10) |

Per SPEC-000/PLAN-000, every failure mode from this process collapses to the same
`ProviderUnavailableError` on the `sidecar.ts` side -- this process doesn't need to
distinguish "the model failed" from "the model was slow" for the app to behave correctly; it
only needs the *sidecar adapter itself* to distinguish "500-boundary API failure" (transport
absent, `PROVIDER_UNAVAILABLE`) from a schema failure (which `validate.ts` raises client-side
after receiving `result`, not something this process itself produces).

## Running it

```sh
npm install
npm run build
npm start          # or: npm run dev (tsx, no build step)
```

Listens on `PORT` (default `8787`). Requires a working `claude` CLI session (subscription
auth via the macOS keychain) to actually reach the Agent SDK -- see `docs/adr/
0001-inference-boundary.md`. There is no way to exercise a live call in CI or a container;
see "Test coverage" below.

## Test coverage vs. manual verification

- **Covered by `npm test` (mocked Agent SDK boundary):** `agent-query.ts`'s message parsing
  (success/error/missing-`structured_output`/no-result-message) and timeout enforcement;
  `server.ts`'s HTTP request/response shape, status-code mapping for each failure mode, and
  routing (404 for unknown paths/methods). All of this injects a fake `queryFn` rather than
  calling the real Agent SDK.
- **Not covered by automated tests, requires manual verification** (per `docs/
  00-capstone-plan.md`'s verification step 5, and as flagged in `TASKS-000` Task 9): an actual
  live call through `query()` to a running `claude` CLI on subscription auth. To verify
  manually: `npm run dev` on the host, then from the app with `LLM_PROVIDER=sidecar`, trigger
  a real STARS diagnosis and confirm a schema-valid response returns end to end.
