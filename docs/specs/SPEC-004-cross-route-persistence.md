# SPEC-004 — Cross-route persistence for diagnosis, plan, and stakeholder state

**Status:** draft
**Owner:** architect
**Depends on:** SPEC-001 (STARS diagnosis), SPEC-002 (30/60/90 plan — reuses `lib/plan/repository.ts`
unchanged), SPEC-003 (stakeholder map)

## Context & problem

The app's server actions (`app/app/_lib/actions.ts`) currently read and write a
module-level in-memory object (`app/app/_lib/store.ts`) standing in for a real
persistence layer. A live Block 3 integration run against the actual containerized
production build (`docker compose up --build`, not `npm run dev`) found that this store
does not reliably share state across different page routes: a diagnosis submitted on
`/diagnosis` was not visible from `/plan` moments later, even though the same store
appeared to work correctly within a single dev-mode session. `store.ts`'s own comment
already anticipated this store as a temporary stand-in, pointing at the Prisma models in
`prisma/schema.prisma` and the repository seam already built for plans
(`lib/plan/repository.ts`, per PLAN-002) as the intended real persistence path.

This spec covers extending that same repository pattern to diagnosis and stakeholder
state, and wiring all three into the app's actions and pages, so the demo's core flow
(diagnose → plan → stakeholders) is backed by real, durable, cross-route-consistent
storage in the actual deployed container.

## User outcomes

- A user who submits a STARS intake on `/diagnosis`, then navigates to `/plan`, sees plan
  generation use the diagnosis they just submitted — not a "complete a diagnosis first"
  message caused by the two pages not sharing state.
- A user's diagnosis correction (STARS type override) is what subsequent plan generation
  actually uses, regardless of which page or request handles the generation.
- A user's added or repositioned stakeholders remain visible after navigating away from
  `/stakeholders` and back.
- None of this requires the app to stay running as a single specific process — the state
  survives a restart, matching what "persistence" actually means for a containerized app.

## Acceptance criteria

- **AC-4.1** — Saving a STARS diagnosis via the diagnosis repository, then retrieving it
  via a separately constructed repository instance, returns a record with the same
  effective type as what was saved.
- **AC-4.2** — A diagnosis correction (override) saved via the repository is what a
  separately constructed repository instance's retrieval returns as the effective type —
  not the original, pre-correction type.
- **AC-4.3** — When multiple diagnoses have been saved over time, retrieval returns the
  most recently saved one (there is no auth/session concept in this app — "current" means
  "most recent," matching the existing single-instance demo scope).
- **AC-4.4** — When no diagnosis has ever been saved, retrieval returns `null` rather than
  throwing.
- **AC-4.5** — Saving a plan via the Prisma-backed plan repository
  (`createPrismaPlanRepository`, already implemented but never exercised by any test or
  caller), then retrieving it via a separately constructed Prisma-backed repository
  instance, returns a plan matching what was saved.
- **AC-4.6** — Saving a stakeholder via the stakeholder repository, then retrieving all
  stakeholders via a separately constructed repository instance, includes that
  stakeholder with its saved influence/support/quadrant values.
- **AC-4.7** — A stakeholder's quadrant reposition, saved via the repository, is what a
  separately constructed repository instance's retrieval subsequently returns.

## Out of scope

- **Multi-user/session isolation.** "Current diagnosis" stays a single global
  most-recently-saved concept per AC-4.3, matching the app's existing no-auth scope
  (`store.ts`'s own documented assumption). Real multi-tenancy is a backlog concern, not
  addressed here.
- **Persisting `dataStatus`/`skippedCount`** (the stakeholder map's MCP-availability
  metadata). These describe *this request's* MCP reachability, not stored history — they
  are recomputed live from a fresh MCP call each page load, same as today. Only resolved
  `Stakeholder` rows (mcp-sourced and manual alike) are persisted.
- **`lastIntakeError`/`lastPlanError`.** These are transient, UI-only messages with no
  value surviving a restart. They stay as in-memory module state; only the three data
  models (diagnosis, plan, stakeholders) move to Prisma.
- **A full live end-to-end integration test** (submit via the real UI action, navigate,
  generate) requiring a live Postgres connection in CI. Per `docs/adr/0002-fixture-first-
  testing.md`'s principle, no test run requires a live database — every AC above is
  verified against a repository interface with a mocked Prisma client boundary, the same
  pattern `app/api/readyz/route.spec.ts` already established. The actual cross-route fix
  is verified manually (`docker compose up --build` + real browser interaction), the same
  precedent SPEC-000 set for the sidecar's live Agent SDK call.
- **Changes to domain logic** — `lib/stars/diagnosis.ts`, `lib/plan/generate.ts`,
  `lib/stakeholders/classify.ts`, and the existing edit/export functions are unaffected;
  this spec only changes what stores and retrieves their inputs/outputs.

## Open questions

- None outstanding. (Considered whether `lastIntakeError`/`lastPlanError` should also
  move to Prisma — resolved above as out of scope, since they carry no data worth
  surviving a restart.)

## Traceability

| AC | Behaviour | Test |
|----|-----------|------|
| AC-4.1 | Saving a diagnosis, retrieving via a separate repository instance, returns the same effective type | lib/stars/repository.spec.ts > diagnosis repository > saving a diagnosis and retrieving it via a separate repository instance returns the same effective type |
| AC-4.2 | A correction saved via the repository is what a separate instance's retrieval returns | lib/stars/repository.spec.ts > diagnosis repository > a correction saved via the repository is reflected in a separate instance's retrieval |
| AC-4.3 | Retrieval returns the most recently saved diagnosis | lib/stars/repository.spec.ts > diagnosis repository > retrieval returns the most recently saved diagnosis when multiple exist |
| AC-4.4 | Retrieval returns null when nothing has been saved | lib/stars/repository.spec.ts > diagnosis repository > retrieval returns null when no diagnosis has been saved |
| AC-4.5 | The Prisma-backed plan repository round-trips a saved plan via a separate instance | lib/plan/repository.spec.ts > plan repository > the Prisma-backed repository returns a saved plan via a separately constructed instance |
| AC-4.6 | A saved stakeholder is included in a separate instance's retrieval | lib/stakeholders/repository.spec.ts > stakeholder repository > a saved stakeholder is included in a separate instance's retrieval |
| AC-4.7 | A stakeholder reposition is reflected in a separate instance's retrieval | lib/stakeholders/repository.spec.ts > stakeholder repository > a reposition saved via the repository is reflected in a separate instance's retrieval |
