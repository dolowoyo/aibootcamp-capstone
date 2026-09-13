# TASKS-002 — 30/60/90 plan generation

**Implements:** PLAN-002 / SPEC-002
**Executed via:** `executing-plans` skill

- [ ] **Task 1** — Implement the `Plan`/`Milestone` Zod schema
      (`lib/inference/schemas/plan.ts`) — prerequisite for AC-2.1, AC-2.3 (schema shape those
      ACs' tests validate against). Relates to: #10
- [ ] **Task 2** — Implement `lib/plan/generate.ts` (`generatePlan()`, `MissingDiagnosisError`)
      and its AC-2.8 test in `lib/plan/generation.spec.ts` — satisfies AC-2.8. Relates to: #10
- [ ] **Task 3** — Author plan fixture scenarios (`fixtures/inference/plan/startup.json`,
      `turnaround.json`) with substantively distinct Day 1-30 milestone content, plus the
      committed generation prompt — prerequisite data for AC-2.1, AC-2.2, AC-2.3. Relates to:
      #10
- [ ] **Task 4** — Wire the fixture adapter's `generatePlan` to the Task 3 scenarios; write
      `lib/plan/generation.spec.ts`'s AC-2.1 test (milestones grouped into exactly three
      phases) — satisfies AC-2.1. Relates to: #10
- [ ] **Task 5** — Write `lib/plan/generation.spec.ts`'s AC-2.2 test (Day 1-30 content differs
      between Startup and Turnaround fixture plans) — satisfies AC-2.2. Relates to: #10
- [ ] **Task 6** — Write `lib/plan/generation.spec.ts`'s AC-2.3 test (every milestone's
      rationale references the diagnosis's situation type) — satisfies AC-2.3. Relates to: #12
- [ ] **Task 7** — Implement `lib/plan/edit.ts` (`editMilestoneText`, `addMilestone`,
      `moveMilestone`) with Prisma-backed persistence, and
      `lib/plan/editing.spec.ts`'s AC-2.4/AC-2.5/AC-2.6 tests — satisfies AC-2.4, AC-2.5,
      AC-2.6. Relates to: #11
- [ ] **Task 8** — Implement `lib/plan/export.ts` (`exportPlan()`) and
      `lib/plan/export.spec.ts`'s AC-2.7 test (export reflects all phases and prior edits) —
      satisfies AC-2.7. Relates to: #13

## Sequencing notes

Task 1 (schema) blocks Tasks 2, 4, 6, 7 (all operate on `Plan`/`Milestone`). Task 3 (fixtures)
blocks Tasks 4, 5, 6. Task 7 (editing) blocks Task 8 (export must reflect edits, so its test
needs `edit.ts` to exist first). Task 2 (`MissingDiagnosisError` precondition) has no
dependency on fixtures and can run in parallel with Task 3.
