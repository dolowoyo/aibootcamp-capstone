# PLAN-002 — 30/60/90 plan generation

**Implements:** SPEC-002
**Written via:** `writing-plans` skill

## ACs covered

AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-2.7, AC-2.8 — all ACs in SPEC-002.

## Technical approach

**Schema (inference boundary, per `PLAN-000`):** `lib/inference/schemas/plan.ts` defines the
`Plan`/`Milestone` Zod schema — this spec's own deliverable, per the same resolved
schema-ownership question as `PLAN-001`.

**Domain logic:**
- `lib/plan/generate.ts` — `generatePlan(diagnosis)` calls `provider.generatePlan()` with the
  diagnosis's `effectiveType` (from `PLAN-001`'s `DiagnosisRecord`). If no diagnosis is passed
  (`undefined`/`null`), it throws `MissingDiagnosisError` before ever reaching the provider —
  this is what makes AC-2.8 a precondition check, not a provider-level failure.
- `lib/plan/edit.ts` — pure functions operating on a `Plan` value: `editMilestoneText`,
  `addMilestone`, `moveMilestone`. Each returns a new `Plan`; the calling API route persists
  the result via the existing Prisma-backed `Plan`/`Milestone` models (repo layout already
  plans `prisma/schema.prisma`) so "persisted" (AC-2.4–AC-2.6) means a real database write, not
  in-memory-only state that a page refresh would lose.
- `lib/plan/export.ts` — `exportPlan(plan)` renders the current `Plan` value (post-edits) to a
  fixed plain-text/Markdown representation, grouped by phase — chosen over a binary format
  (PDF) for the capstone's time budget; still usable via copy or browser print-to-PDF.

**Fixture data:** `fixtures/inference/plan/startup.json` and `turnaround.json` — two distinct
scenario plans whose Day 1–30 milestone `text` fields are deliberately non-overlapping, so
AC-2.2's "not textually interchangeable" check is a direct structural inequality assertion
between the two fixture-derived plans, not a semantic judgment call.

## Interfaces / contracts

```ts
// lib/inference/schemas/plan.ts
type Phase = "1-30" | "31-60" | "61-90";

interface Milestone {
  id: string;
  phase: Phase;
  order: number;
  text: string;
  rationale: string;   // must reference situation type, per AC-2.3
}

interface Plan {
  diagnosisId: string;
  milestones: Milestone[];
}

// lib/plan/generate.ts
class MissingDiagnosisError extends Error {}
function generatePlan(diagnosis: DiagnosisRecord | null | undefined): Promise<Plan>;

// lib/plan/edit.ts
function editMilestoneText(plan: Plan, milestoneId: string, text: string): Plan;
function addMilestone(plan: Plan, phase: Phase, text: string, rationale: string): Plan;
function moveMilestone(plan: Plan, milestoneId: string, toPhase: Phase, toOrder: number): Plan;

// lib/plan/export.ts
function exportPlan(plan: Plan): string;  // Markdown, grouped by phase, in milestone order
```

## Tradeoffs considered

- **Prisma-backed persistence vs. client-only state.** Prisma chosen — AC-2.4–AC-2.6 all
  require edits to survive "subsequent retrieval," which a client-only store can't guarantee
  across a page reload; the stack already plans a Postgres+Prisma layer for this reason.
- **Markdown/plain-text export vs. generated PDF.** Plain-text/Markdown chosen for the time
  budget — still satisfies "shareable" (AC-2.7) via copy-out or the browser's own
  print-to-PDF, without needing a PDF-generation dependency this capstone doesn't otherwise
  need.
- **Deterministic milestone IDs from fixtures vs. runtime-random IDs.** Fixture-sourced
  milestones carry fixed IDs baked into the JSON; any milestone added at runtime (AC-2.5) uses
  an ID generator that `builder` should make injectable (e.g. a counter or UUID factory passed
  in, not called globally) so tests can supply a deterministic one and avoid flakiness.

## Risks

- **Auto-regeneration ambiguity.** SPEC-002 explicitly left open whether correcting a
  diagnosis auto-regenerates an existing plan. This plan assumes "no" (see SPEC-002's Open
  questions) and `generatePlan()` is written as an explicit, user-triggered call only — if
  that assumption is overturned, `generate.ts`'s call sites (not its contract) would need to
  change, not this plan's interfaces.
- **Fixture plans not actually distinct enough.** If `startup.json` and `turnaround.json`'s
  Day 1–30 content is only trivially different (e.g. one word swapped), AC-2.2's test would
  pass without meaningfully proving situation-awareness. `builder` should write fixture
  milestone text that differs in substance (different focus areas, not just different nouns).
- **`moveMilestone`'s combined phase+order semantics.** AC-2.6 covers both "move to a
  different phase" and "reorder within a phase" as one behavior; if these turn out to need
  different persistence semantics (e.g. concurrent edits), that would surface as an
  implementation-time question for `builder`, not a spec gap — the AC's observable contract
  doesn't distinguish the two cases.
