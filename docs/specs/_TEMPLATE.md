# SPEC-00N — <Title>

**Status:** draft | approved | implemented | amended | superseded

`draft`/`approved` — the spec is the source of truth but its tests may not exist yet (normal
right after merge). `implemented` — flip this once the PR that adds the ACs' real tests
lands; from that point, `scripts/check-traceability.ts` strictly enforces every traceability
row resolves to a real, existing test (see the script's header comment for the two-tier
model). Flipping the status is part of the implementing PR, not a separate step.
**Owner:** <agent or human>
**Depends on:** SPEC-00M (if any)

## Context & problem

What situation makes this necessary. One paragraph. No implementation detail.

## User outcomes

What a user (or calling system, for SPEC-000) can do after this ships, that they couldn't
before. Written from their point of view, not the system's.

## Acceptance criteria

Numbered `AC-N.M`. Each one:
- describes **observable behaviour** — what can be seen or measured, not internal mechanics
- is independently testable by exactly one test
- is falsifiable — someone reading it can say "yes this passed" or "no it didn't"

- **AC-N.1** — <behaviour>
- **AC-N.2** — <behaviour>

## Out of scope

What this spec deliberately does not cover, and where that work is tracked instead
(a backlog issue number, or "not yet filed").

## Open questions

Anything unresolved when this spec was written. Resolve before implementation starts, or
explicitly accept the risk and say so.

## Traceability

Every AC above must appear exactly once below, mapped to a real test name. This table is
parsed by `scripts/check-traceability.ts` and enforced in CI — a missing or dangling row
fails the build.

| AC | Behaviour | Test |
|----|-----------|------|
| AC-N.1 | <short restatement> | path/to/test.spec.ts > describe block > test name |
| AC-N.2 | <short restatement> | path/to/test.spec.ts > describe block > test name |

**Do not wrap the Test column in backticks.** `scripts/check-traceability.ts` now strips
leading/trailing backticks defensively, but write it plain — this table is parsed as data,
not rendered as code.
