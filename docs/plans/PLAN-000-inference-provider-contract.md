# PLAN-000 — Inference provider contract

**Implements:** SPEC-000
**Written via:** `writing-plans` skill

## ACs covered

All of SPEC-000: AC-0.1, AC-0.2, AC-0.3, AC-0.4, AC-0.5, AC-0.6, AC-0.7, AC-0.8, AC-0.9,
AC-0.10, AC-0.11.

This plan was deferred when SPEC-000 was originally drafted (see SPEC-000's Open questions,
"Where do the shared Zod schemas live?" — resolved 2026-09-13). It exists to settle that
resolution concretely: where schema modules live, and how validation is enforced, without
inventing the field contents that belong to `PLAN-001`/`PLAN-002`.

## Technical approach

**Module layout** (per repo layout in `docs/00-capstone-plan.md`):

```
lib/inference/
  provider.ts              Provider interface + createProvider() factory
  provider-factory.ts       LLM_PROVIDER env-var selection logic (AC-0.6-0.9)
  errors.ts                 SchemaValidationError, ProviderUnavailableError,
                             ProviderConfigurationError
  validate.ts               validateAgainstSchema<T>() — the one enforcement point
                             every adapter routes through (AC-0.2, AC-0.3)
  schemas/                  Zod schema *modules* live here. This plan creates the
                             directory and the module contract (below); it does not
                             define what's inside stars-diagnosis.ts or plan.ts —
                             those are SPEC-001's and SPEC-002's own deliverables.
  adapters/
    fixture.ts              deterministic canned responses (AC-0.4, AC-0.5)
    sidecar.ts               HTTP client to services/inference-sidecar (AC-0.10)
    anthropic.ts             @anthropic-ai/sdk client, written but unwired (AC-0.9)
fixtures/inference/          canned JSON, one directory per consuming spec
services/inference-sidecar/  host-only process; owns the Agent SDK query() call
```

Every adapter's `diagnoseStars`/`generatePlan` implementation returns its raw result through
`validate.ts`'s single `validateAgainstSchema()` call before it ever reaches the caller — this
is what makes AC-0.2/AC-0.3 uniform across adapters "by construction" rather than by each
adapter remembering to validate independently.

`provider-factory.ts` reads `process.env.LLM_PROVIDER` once, at construction time, and returns
one of the three adapters. Invalid or unset values both resolve to `fixture` (AC-0.7, AC-0.8) —
implemented as a single lookup table with `fixture` as the explicit fallback for any key miss,
not an if/else chain that could silently diverge from that guarantee as adapters are added.

`anthropic.ts` checks `process.env.ANTHROPIC_API_KEY` synchronously inside its constructor
(not on first call) and throws `ProviderConfigurationError` immediately if unset — this is
what makes AC-0.9 a construction-time failure rather than a first-call surprise.

`sidecar.ts` wraps its HTTP call (`fetch` with a bounded timeout) in a try/catch that maps
*any* failure mode (connection refused, timeout, non-2xx status) to `ProviderUnavailableError`
— never re-throwing the underlying fetch error directly, so callers only ever need to check
against the three named error classes (AC-0.11).

## Interfaces / contracts

```ts
// lib/inference/provider.ts
interface InferenceProvider {
  diagnoseStars(intake: unknown): Promise<StarsDiagnosis>;   // shape from SPEC-001
  generatePlan(diagnosis: unknown): Promise<Milestone[]>;    // shape from SPEC-002
}
function createProvider(env?: NodeJS.ProcessEnv): InferenceProvider;

// lib/inference/errors.ts
class SchemaValidationError extends Error { readonly code = "SCHEMA_VALIDATION"; }
class ProviderUnavailableError extends Error { readonly code = "PROVIDER_UNAVAILABLE"; }
class ProviderConfigurationError extends Error { readonly code = "PROVIDER_CONFIGURATION"; }
// AC-0.11: callers discriminate on `.code` (or `instanceof`), never on message text.

// lib/inference/validate.ts
function validateAgainstSchema<T>(schema: ZodType<T>, raw: unknown): T;
// throws SchemaValidationError on parse failure; returns the parsed, typed value on success.

// lib/inference/schemas/ — module contract every schema file follows (content TBD by
// SPEC-001/SPEC-002):
interface SchemaModule<T> {
  schema: ZodType<T>;
}
```

Environment contract: `LLM_PROVIDER` ∈ `{fixture, sidecar, anthropic}` (anything else →
`fixture`); `ANTHROPIC_API_KEY` required only when `LLM_PROVIDER=anthropic`. Sidecar/anthropic
call timeout: 30 seconds (resolves SPEC-000's open question on timeout duration) — chosen as
long enough for a cold-started `claude` CLI subprocess, short enough that a hang is still
distinguishable from a working demo within the video's time budget.

## Tradeoffs considered

- **Zod vs. a hand-rolled validator.** Zod chosen — already the natural fit for a TypeScript
  codebase, gives structured error info for free, and is a de facto standard the `builder`
  agent won't need to learn from scratch.
- **JSON fixture files vs. inline TS fixture objects.** JSON chosen for `fixtures/inference/`
  — easier to diff and review as a fixture artifact independent of code, and forces fixture
  data through the same `validateAgainstSchema()` path as any other adapter response, which
  catches schema/fixture drift immediately instead of trusting a TS literal's static type.
- **One central `errors.ts` vs. per-adapter error types.** Central chosen, specifically because
  AC-0.11 requires cross-adapter discriminability — a shared hierarchy guarantees that by
  construction; independently-defined per-adapter errors would need an explicit reconciliation
  step that's easy to forget.
- **No retry logic in `sidecar.ts` for this plan.** SPEC-000 left retry/backoff as an open
  question deferred to the plan; this plan defers it further, to implementation time in
  Block 2, on the grounds that a demo-scale sidecar (one process, one operator) doesn't need
  it to prove the architecture, and adding it later can't change AC-0.10's contract (any
  failure still resolves to `ProviderUnavailableError` or a success — never a third outcome).

## Risks

- **Fixture/schema drift.** If a fixture JSON file and its schema module diverge, the failure
  should surface as a normal `SchemaValidationError` in CI the first time that fixture is
  exercised — not as a silent pass-through. Verify this by deliberately corrupting one fixture
  field during implementation and confirming the test fails with the expected error type.
- **30s timeout tuned wrong.** Too short flakes a legitimately slow (but successful) sidecar
  cold start; too long makes a genuine hang indistinguishable from "still working" on camera.
  Revisit this constant if Block 2's actual sidecar cold-start timing differs materially from
  this estimate.
- **`anthropic.ts` bit-rot.** Written but never exercised against a live API (no key exists),
  so it can silently drift out of conformance with the shared interface over time. Mitigated
  by including it in the mocked-boundary conformance test SPEC-000's Out of Scope section
  calls for — that test still catches an interface mismatch even without live credentials.
