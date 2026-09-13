# SPEC-000 — Inference provider contract

**Status:** approved
**Owner:** architect
**Depends on:** None (foundational). Formalizes `docs/adr/0001-inference-boundary.md`.
SPEC-001 and SPEC-002 depend on this spec's interface.

## Context & problem

The app needs LLM inference (a STARS diagnosis, a 30/60/90 plan) but this capstone has no
Anthropic API key and no cloud account. ADR-0001 resolves the resulting constraint
architecturally: inference runs behind a provider interface with three interchangeable
adapters — `fixture` (canned, deterministic), `sidecar` (HTTP client to a host-side process
that owns the Claude Agent SDK), and `anthropic` (a real `@anthropic-ai/sdk` client, written
but unwired until a key exists).

Constitution principle III requires that non-determinism be confined to one named seam and
that model output be schema-validated at the boundary regardless of adapter. This spec is
that seam's contract: the one interface all three adapters must satisfy, the validation
guarantee that applies uniformly to all of them, and the defined behavior when any adapter
fails. Every consumer of inference in this app (SPEC-001's STARS diagnosis, SPEC-002's plan
generation) is built against this contract, not against any one adapter directly — so a
mistake here cascades into both.

## User outcomes

The "user" of this spec is a calling system, not an end user — SPEC-001 and SPEC-002's code,
and the test suite that exercises them.

- A calling module can request a STARS diagnosis or a plan without knowing or caring which
  adapter is currently active — the same two calls work identically in a local dev session
  (`sidecar`), in CI (`fixture`), and in a future demo with a real key (`anthropic`).
- A test author can write a test once, run it against the `fixture` adapter, and trust that
  the result will be identical on every run, on any machine, with no network access.
- An operator can switch which adapter is active with one environment variable, and can never
  accidentally end up making a live inference call by leaving that variable unset or
  mistyped.
- Any code that receives a diagnosis or a plan can trust its shape unconditionally — it never
  needs to defensively re-check fields the schema already guarantees, and it never receives
  a value that silently failed validation.

## Acceptance criteria

- **AC-0.1** — Each of the three adapters (`fixture`, `sidecar`, `anthropic`) exposes the same
  two operations with the same names and same input/output shapes: a `diagnoseStars`
  operation that accepts an intake and resolves to a STARS diagnosis, and a `generatePlan`
  operation that accepts a diagnosis and resolves to an array of milestone objects. One
  identical conformance check, run against all three adapters, passes for each without
  adapter-specific exceptions.
- **AC-0.2** — When an adapter's underlying response (a fixture lookup, a sidecar HTTP
  response, or an Anthropic API response) is well-formed, the value handed back to the caller
  has already passed the shared schema check — the caller never receives a payload that
  skipped validation, regardless of which adapter produced it.
- **AC-0.3** — When an adapter's underlying response fails the shared schema check (missing
  required field, wrong type, or otherwise malformed), the operation rejects with a
  distinguishable `SchemaValidationError` instead of returning the malformed value to the
  caller.
- **AC-0.4** — Calling the `fixture` adapter's `diagnoseStars` twice with the same intake
  returns deep-equal results both times; calling its `generatePlan` twice with the same
  diagnosis returns deep-equal results both times.
- **AC-0.5** — The `fixture` adapter's output for a given input is identical regardless of
  wall-clock time, random seed, or network availability — it produces the same result with
  outbound network access disabled as it does with network access available.
- **AC-0.6** — Given `LLM_PROVIDER=fixture`, `=sidecar`, or `=anthropic`, the resulting
  provider serves calls from, respectively: local fixture data only (no outbound network
  call is made), the sidecar's HTTP endpoint, or the Anthropic API — matching the selected
  value, with no cross-over between them.
- **AC-0.7** — When `LLM_PROVIDER` is unset, the provider that gets constructed is the
  `fixture` adapter.
- **AC-0.8** — When `LLM_PROVIDER` is set to a value that is none of `fixture`, `sidecar`, or
  `anthropic`, the provider that gets constructed is the `fixture` adapter — not an error,
  not a live-inference attempt, and not a silent default to `anthropic`.
- **AC-0.9** — Selecting `LLM_PROVIDER=anthropic` while `ANTHROPIC_API_KEY` is unset fails
  immediately at construction time with a distinguishable `ProviderConfigurationError`,
  rather than constructing successfully and failing later on the first call, and rather than
  silently substituting a different adapter.
- **AC-0.10** — When the `sidecar` adapter's HTTP call fails (connection refused, timeout, or
  a non-2xx response), the operation rejects with a distinguishable
  `ProviderUnavailableError` — the caller never receives a partial, default, or fabricated
  result in place of a real failure.
- **AC-0.11** — A caller can distinguish a `SchemaValidationError` (AC-0.3) from a
  `ProviderUnavailableError` (AC-0.10) from a `ProviderConfigurationError` (AC-0.9) by type or
  code alone, without parsing the error's message string.

## Out of scope

- The specific field shapes of `StarsDiagnosis` and the milestone objects — those schemas are
  owned by SPEC-001 and SPEC-002 respectively. This spec only requires that *some* shared
  schema is enforced uniformly; it does not define what's in it.
- The specific set of fixture scenarios (which intakes map to which canned diagnoses, edge
  cases, unhappy paths) — owned by whichever spec needs that fixture data (SPEC-001,
  SPEC-002), each of which will specify its own fixture requirements.
- The sidecar process's internals (how it authenticates via the Agent SDK, its HTTP framing,
  its port) — covered by ADR-0001 and the plan for this spec, not by this spec's acceptance
  criteria.
- Retry, backoff, or timeout policy for the `sidecar` and `anthropic` adapters — not
  specified here; see Open questions.
- Rate limiting, cost controls, or concurrency limits on live inference — not in scope for
  this capstone.
- Live, automated testing of the `anthropic` adapter against the real Anthropic API — it is
  written but unwired per ADR-0001, and no key exists to exercise it in CI. Any test proving
  its conformance (AC-0.1) does so against a mocked HTTP/SDK boundary, not a live call.

## Open questions

- **Retry/backoff policy for transient sidecar failures.** This spec defines that a failure
  surfaces as `ProviderUnavailableError` (AC-0.10), but not whether the sidecar adapter
  retries before giving up. Deferred to the plan; if a retry is added, it must still resolve
  to one of the two defined outcomes (success or `ProviderUnavailableError`), not a new
  failure mode.
- ~~Where do the shared Zod schemas live?~~ **Resolved 2026-09-13:** PLAN-000 defines the
  schema *module locations and validation mechanism* (e.g. `lib/inference/schemas/`,
  `SchemaValidationError`). SPEC-001 and SPEC-002 define and commit the actual field
  contents into those modules as their own deliverable once written. PLAN-000 does not
  invent placeholder field shapes — it establishes where they'll live and how they're
  enforced, nothing more.
- **Timeout duration for sidecar/anthropic calls.** A concrete value (e.g. 30s) is a plan
  detail, not an AC, but the plan must pick one — an operation that hangs forever is
  indistinguishable from AC-0.10's failure case never firing.

## Traceability

| AC | Behaviour | Test |
|----|-----------|------|
| AC-0.1 | All three adapters expose the same `diagnoseStars`/`generatePlan` shape | lib/inference/provider.contract.spec.ts > provider contract > each adapter (fixture, sidecar, anthropic) implements diagnoseStars and generatePlan with schema-valid output |
| AC-0.2 | A well-formed adapter response is only ever returned to the caller after passing schema validation | lib/inference/boundary-validation.spec.ts > schema validation at the boundary > a well-formed adapter payload is returned to the caller only after passing schema validation |
| AC-0.3 | A malformed adapter response is rejected with `SchemaValidationError`, not passed through | lib/inference/boundary-validation.spec.ts > schema validation at the boundary > a malformed adapter payload is rejected with SchemaValidationError instead of being returned |
| AC-0.4 | Fixture adapter returns deep-equal output across repeated calls with the same input | lib/inference/adapters/fixture.spec.ts > fixture adapter determinism > diagnoseStars and generatePlan return deep-equal output across repeated calls with the same input |
| AC-0.5 | Fixture adapter output is unaffected by time, randomness, or network availability | lib/inference/adapters/fixture.spec.ts > fixture adapter determinism > output is unchanged with wall-clock time varied, random seed varied, and network access disabled |
| AC-0.6 | `LLM_PROVIDER` value routes calls to the matching adapter with no cross-over | lib/inference/provider-factory.spec.ts > adapter selection > LLM_PROVIDER of fixture, sidecar, or anthropic routes calls to the matching adapter only |
| AC-0.7 | Unset `LLM_PROVIDER` constructs the fixture adapter | lib/inference/provider-factory.spec.ts > adapter selection > an unset LLM_PROVIDER constructs the fixture adapter |
| AC-0.8 | Invalid `LLM_PROVIDER` value constructs the fixture adapter, not an error or live default | lib/inference/provider-factory.spec.ts > adapter selection > an invalid LLM_PROVIDER value constructs the fixture adapter rather than throwing or defaulting to a live provider |
| AC-0.9 | Selecting `anthropic` without `ANTHROPIC_API_KEY` fails fast at construction with `ProviderConfigurationError` | lib/inference/provider-factory.spec.ts > adapter selection > selecting anthropic without ANTHROPIC_API_KEY set throws ProviderConfigurationError at construction time |
| AC-0.10 | Sidecar network/HTTP failure rejects with `ProviderUnavailableError` | lib/inference/adapters/sidecar.spec.ts > sidecar adapter failure handling > a connection failure or non-2xx response rejects with ProviderUnavailableError |
| AC-0.11 | `SchemaValidationError`, `ProviderUnavailableError`, and `ProviderConfigurationError` are distinguishable by type alone | lib/inference/errors.spec.ts > error distinguishability > SchemaValidationError, ProviderUnavailableError, and ProviderConfigurationError are distinguishable by type without parsing the error message |
