# ADR-0002 — Every test and CI run uses the `fixture` adapter exclusively

**Status:** Accepted
**Date:** 2026-09-13

## Context

This app's core feature surface (STARS diagnosis, 30/60/90 plan generation) is built on LLM
inference. Constitution principle III requires that non-determinism be confined to one named
seam and never leak past it. ADR-0001 already establishes *how* inference is reachable at all
given the no-API-key, no-cloud-account constraint (a host-side sidecar behind a provider
interface with three adapters: `fixture`, `sidecar`, `anthropic`).

That resolves *access* to inference. It doesn't, on its own, resolve *testability*. Two of the
three adapters (`sidecar`, `anthropic`) are non-deterministic by nature — different wording,
different latency, different model versions over time — and one of them (`sidecar`) only
works on a machine that's actually logged into Claude Code. A test suite, and especially a CI
run on a fresh GitHub Actions runner, has neither of those things available even if
determinism weren't a concern at all.

## Decision

Every test and every CI run sets `LLM_PROVIDER=fixture`, with no exception. This isn't a
temporary stand-in for "real" testing that gets swapped out later — it's the permanent,
by-design testing story for this app's inference boundary. Concretely:

- `SPEC-000` (AC-0.4, AC-0.5) makes this a first-class, tested guarantee, not a convention:
  the `fixture` adapter must return deep-equal output across repeated calls with the same
  input, and its output must be unaffected by wall-clock time, random seed, or network
  availability.
- `SPEC-000` (AC-0.7, AC-0.8) makes `fixture` the *default* provider — an unset or invalid
  `LLM_PROVIDER` resolves to `fixture`, never to a live adapter. A test author who forgets to
  set the variable at all still gets deterministic behavior, not an accidental live call.
- `SPEC-001`/`SPEC-002`'s tests are written entirely against fixture scenario data
  (`fixtures/inference/stars/*.json`, `fixtures/inference/plan/*.json`) that is committed to
  the repo, reviewed like any other artifact, and asserted against structurally — never by
  judging LLM prose quality (see `CLAUDE.md`'s "don't" list), which would be both unstable and
  untestable in the deterministic sense principle III requires.
- Every adapter response, `fixture` included, still passes through the same shared schema
  validation (`lib/inference/validate.ts`, SPEC-000 AC-0.2/AC-0.3) as `sidecar`/`anthropic`
  would — fixture-mode testing exercises the real validation boundary, not a bypassed one.

## Consequences

- The full test suite, including CI, runs with zero outbound network dependency for inference
  and zero dependency on any credential, subscription, or host-only process. A contributor
  (or a fresh GitHub Actions runner) can clone the repo and run the whole suite offline.
- Confidence in `sidecar`/`anthropic` conformance to the shared interface comes from the
  mocked-boundary conformance test SPEC-000 calls for (its Out of Scope section), not from
  exercising the real HTTP call or the real Anthropic API in CI. This is a real, accepted
  limitation: a bug specific to the real sidecar's HTTP framing, or a real Anthropic response
  shape drifting from what the schema expects, would not be caught by CI — it would surface at
  manual verification time (`docs/00-capstone-plan.md`'s verification steps 4-5) instead.
- Fixture data becomes a first-class, reviewable artifact rather than test-file boilerplate:
  each scenario file is committed with its generation prompt (constitution principle VII) and
  is itself evidence of the situation types the app was actually built and tested against.
- This is the concrete mechanism that makes the video's "delete a traceability row, watch CI
  go red" demo moment safe to perform live — the whole CI pipeline it's part of has no
  non-deterministic dependency that could independently make that demo flaky.

## Alternatives considered

- **Mock the LLM client library directly in each test (e.g. mock `@anthropic-ai/sdk`), rather
  than a first-class `fixture` adapter.** Rejected — this would duplicate mocking logic across
  every test file and every consumer (SPEC-001, SPEC-002), instead of centralizing it once as
  an adapter that satisfies the exact same interface the real adapters do. A first-class
  adapter is also what makes AC-0.1's "one identical conformance check passes for all three
  adapters" possible at all.
- **Run a subset of tests against `sidecar` in CI, gated to only run on self-hosted runners
  with Claude Code credentials.** Considered and rejected — self-hosted runners with live
  subscription credentials are a bigger operational surface than this capstone's timeline
  supports, and would reintroduce exactly the non-determinism (model wording varies,
  subscription auth can rate-limit or expire) principle III is designed to keep out of the
  test suite entirely.
- **Skip fixture-mode determinism testing (AC-0.4/0.5) and just trust that JSON-in,
  JSON-out is deterministic by construction.** Rejected — "should be deterministic" is
  exactly the kind of unverified assumption this project's own retrospective findings
  (see `docs/decision-log.md`'s SPEC-000 entry) show is worth testing explicitly rather than
  asserting from confidence alone.
