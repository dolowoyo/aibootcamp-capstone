# TASKS-001 — STARS situation diagnosis

**Implements:** PLAN-001 / SPEC-001
**Executed via:** `executing-plans` skill

- [ ] **Task 1** — Implement the `StarsDiagnosis` Zod schema
      (`lib/inference/schemas/stars-diagnosis.ts`) — prerequisite for AC-1.2, AC-1.4, AC-1.5,
      AC-1.6 (schema shape those ACs' tests validate against). Relates to: #6
- [ ] **Task 2** — Implement intake validation (`lib/stars/intake.ts`,
      `lib/stars/intake-validation.spec.ts`) — satisfies AC-1.1. Relates to: #6
- [ ] **Task 3** — Author STARS fixture scenarios (`fixtures/inference/stars/startup.json`,
      `turnaround.json`, `blended-turnaround-realignment.json`, `thin-ambiguous.json`) with
      evidence entries as literal narrative substrings, plus the committed generation prompt
      — prerequisite data for AC-1.2, AC-1.3, AC-1.5, AC-1.6, AC-1.8. Relates to: #6, #7, #8
- [ ] **Task 4** — Wire the fixture adapter's `diagnoseStars` to the Task 3 scenarios; write
      `lib/stars/diagnosis.spec.ts`'s AC-1.2 and AC-1.3 tests (dominant type returned,
      rationale references narrative) — satisfies AC-1.2, AC-1.3. Relates to: #6
- [ ] **Task 5** — Write `lib/stars/diagnosis.spec.ts`'s AC-1.4 and AC-1.5 tests (confidence
      from a fixed set, evidence excerpt present) — satisfies AC-1.4, AC-1.5. Relates to: #7
- [ ] **Task 6** — Write `lib/stars/diagnosis.spec.ts`'s AC-1.6 test (blended narrative yields
      a distinct, labeled secondary type; non-blended yields none) — satisfies AC-1.6.
      Relates to: #8
- [ ] **Task 7** — Implement diagnosis override (`lib/stars/override.ts`, `DiagnosisRecord`,
      `applyOverride()`) and `lib/stars/override.spec.ts` — satisfies AC-1.7. Relates to: #9
- [ ] **Task 8** — Implement thin/ambiguous-input handling (Low confidence + explicit
      limited-evidence rationale) and its test in `lib/stars/diagnosis.spec.ts` — satisfies
      AC-1.8. Relates to: #6, #7

## Sequencing notes

Task 1 (schema) blocks Tasks 4-8 (all consume the `StarsDiagnosis` type). Task 3 (fixtures)
blocks Tasks 4, 5, 6, and 8 (all read fixture scenario data). Task 2 (intake validation) has
no dependency on the schema or fixtures and can run in parallel with Tasks 1/3. Task 7
(override) depends on Task 1's schema but not on Tasks 4-6/8.
