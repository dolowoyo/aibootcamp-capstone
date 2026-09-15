# TASKS-004 — Cross-route persistence for diagnosis, plan, and stakeholder state

**Implements:** PLAN-004 / SPEC-004
**Executed via:** `executing-plans` skill

- [ ] **Task 1** — Implement `app/app/_lib/prisma-client.ts` (`getPrismaClient()` singleton) —
      scaffolding needed by Tasks 2, 3, 4. No AC of its own. Relates to: #68
- [ ] **Task 2** — Implement `lib/stars/repository.ts` (`DiagnosisRepository`,
      `createInMemoryDiagnosisRepository`, `createPrismaDiagnosisRepository`) and
      `lib/stars/repository.spec.ts`'s AC-4.1/AC-4.2/AC-4.3/AC-4.4 tests (Prisma client
      mocked, per `app/api/readyz/route.spec.ts`'s precedent) — satisfies AC-4.1, AC-4.2,
      AC-4.3, AC-4.4. Relates to: #69
- [ ] **Task 3** — Write `lib/plan/repository.spec.ts`'s AC-4.5 test against the existing,
      currently-untested `createPrismaPlanRepository` (Prisma client mocked) — satisfies
      AC-4.5. No production code change expected; if the test reveals a real bug in
      `createPrismaPlanRepository`, fix it as part of this task and note the finding in
      `docs/decision-log.md`. Relates to: #70
- [ ] **Task 4** — Implement `lib/stakeholders/repository.ts` (`StakeholderRepository`,
      `createInMemoryStakeholderRepository`, `createPrismaStakeholderRepository`) and
      `lib/stakeholders/repository.spec.ts`'s AC-4.6/AC-4.7 tests (Prisma client mocked) —
      satisfies AC-4.6, AC-4.7. Relates to: #71
- [ ] **Task 5** — Wire `app/app/_lib/actions.ts` and `diagnosis|plan|stakeholders/page.tsx`
      to the three repositories from Tasks 2-4, per PLAN-004's Interfaces section. Slim
      `app/app/_lib/store.ts` down to `lastIntakeError`/`lastPlanError` only (SPEC-004's Out
      of Scope). No new AC (integration-level, not unit-testable without a live Postgres per
      SPEC-004's Out of Scope) — verify with `npm run build` (compiles, no type errors) plus
      the manual check in Task 6. Relates to: #72
- [ ] **Task 6** — Manual verification: `docker compose down && docker compose up --build`,
      then via real browser — submit a diagnosis on `/diagnosis`, navigate to `/plan` and
      confirm the diagnosis is there (the originally observed bug), generate and edit a
      plan, navigate to `/stakeholders`, add and reposition a stakeholder, navigate away and
      back and confirm it persists. This is the actual fix being verified, not a formality —
      repository tests passing does not by itself prove the bug is fixed. Flip SPEC-004's
      `Status` to `implemented` in this same PR. Relates to: #73

## Sequencing notes

Task 1 (Prisma client singleton) blocks Tasks 2, 3, 4 (each repository's Prisma
implementation needs it — though each repository's *in-memory* implementation and tests can
start before Task 1 lands, since those never touch the Prisma client). Tasks 2, 3, and 4 are
independent of each other and can run in parallel. Task 5 (wiring) depends on all of Tasks
1-4. Task 6 (manual verification) depends on Task 5 and is the task that actually closes the
user-visible bug — do not consider this work done until Task 6 passes for real, against the
built container, not `npm run dev`.
