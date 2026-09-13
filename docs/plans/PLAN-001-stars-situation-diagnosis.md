# PLAN-001 — STARS situation diagnosis

**Implements:** SPEC-001
**Written via:** `writing-plans` skill

## ACs covered

AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6, AC-1.7, AC-1.8 — all ACs in SPEC-001.

## Technical approach

**Schema (at the inference boundary, per `PLAN-000`'s module convention):**
`lib/inference/schemas/stars-diagnosis.ts` defines the `StarsDiagnosis` Zod schema. This is
SPEC-001's own deliverable per SPEC-000's resolved open question — the field *contents* below
are this plan's contribution, not PLAN-000's.

**Domain logic (separate from the schema, per the constitution's "non-determinism confined to
one seam" split):**
- `lib/stars/intake.ts` — `validateIntake()`, enforcing the 50-character minimum (AC-1.1)
  before any call reaches the provider. This is plain validation, not inference — it never
  touches the provider boundary, so it can be tested with zero dependency on `LLM_PROVIDER`.
- `lib/stars/override.ts` — wraps a `StarsDiagnosis` in a `DiagnosisRecord` that tracks the
  original system classification separately from any user correction (AC-1.7), and exposes
  the single `effectiveType` that SPEC-002's plan generation actually consumes.

**Fixture data:** `fixtures/inference/stars/*.json` — one scenario per behavior this spec
needs to prove deterministically: `startup.json`, `turnaround.json`,
`blended-turnaround-realignment.json`, `thin-ambiguous.json`. Each fixture's `evidence` array
entries are written as literal substrings of that fixture's own `narrative` field, so
AC-1.3/AC-1.5 tests assert structural containment (the evidence string appears in the
narrative) rather than judging prose quality — this is what keeps the tests compliant with
`CLAUDE.md`'s "don't assert on LLM prose" rule while the fixture *adapter* is standing in for
a real model. The fixture generation prompt is committed alongside the fixture files per
constitution principle VII.

The fixture adapter's `diagnoseStars()` (from `PLAN-000`) selects one of these four scenarios
by matching on a recognizable marker in the intake narrative (exact matching mechanism is an
implementation detail for `builder`, e.g. a keyword or a scenario-id passed through test
intakes) — deterministic scenario selection, no randomness, no clock dependency (AC-0.4/0.5
carry over from SPEC-000).

## Interfaces / contracts

```ts
// lib/inference/schemas/stars-diagnosis.ts
type StarsType =
  | "startup" | "turnaround" | "accelerated-growth" | "realignment" | "sustaining-success";
type Confidence = "low" | "medium" | "high";

interface StarsDiagnosis {
  dominantType: StarsType;
  secondaryType?: StarsType;      // present only when AC-1.6's blend condition is met
  confidence: Confidence;
  rationale: string;              // must reference narrative content per AC-1.3
  evidence: string[];             // each entry attributable to the narrative, per AC-1.5
}

// lib/stars/intake.ts
interface StarsIntake { narrative: string; }
function validateIntake(intake: StarsIntake): void;  // throws ValidationError { field: "narrative" }

// lib/stars/override.ts
interface DiagnosisRecord {
  original: StarsDiagnosis;
  override?: StarsType;
  effectiveType: StarsType;        // override ?? original.dominantType
}
function applyOverride(record: DiagnosisRecord, correctedType: StarsType): DiagnosisRecord;
```

## Tradeoffs considered

- **Categorical confidence (`low`/`medium`/`high`) vs. a numeric score.** Categorical chosen,
  per SPEC-001's own flagged assumption — easier to test deterministically against fixed
  fixture values, and more legible in a rationale a non-technical user reads.
- **A separate `DiagnosisRecord` wrapper vs. overwriting `dominantType` in place on
  correction.** Wrapper chosen — the original system classification is never destructively
  replaced, which costs almost nothing to implement now and keeps the door open if an audit
  trail requirement (SPEC-001's flagged open question) gets confirmed later, without a schema
  migration.
- **Scenario selection by narrative marker vs. a separate explicit `scenarioId` field on
  intake.** Deferred to `builder`'s implementation judgment — either resolves determinism
  equally well; this plan doesn't need to pick since it doesn't affect any AC's observable
  contract.

## Risks

- **Tautological evidence tests.** If fixture evidence strings are written independently of
  the fixture narrative text, AC-1.3/AC-1.5 tests could pass without actually proving
  attribution. Mitigated by the convention above (evidence entries are literal substrings of
  the narrative) — `builder` should treat a failing substring-containment check as a fixture
  bug, not a reason to loosen the test.
- **Blend detection threshold undefined.** AC-1.6 requires "comparable evidentiary support"
  for a second type — with a fixture adapter this is just "does this scenario's fixture
  include a `secondaryType`," so the fixture path carries no real risk. This becomes a real
  design question only when the `sidecar`/`anthropic` adapters are wired to a live model,
  which is out of this capstone's tested surface (SPEC-000's Out of Scope) — flagged so it
  isn't mistaken for a solved problem beyond the fixture path.
