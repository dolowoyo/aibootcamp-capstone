# PLAN-004 — Cross-route persistence for diagnosis, plan, and stakeholder state

**Implements:** SPEC-004
**Written via:** `writing-plans` skill

## ACs covered

AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.7 — all ACs in SPEC-004.

## Technical approach

**Repository pattern, extended from the existing `lib/plan/repository.ts` precedent.** Each
of the three domains gets a small repository interface with two implementations — an
in-memory one for tests, a Prisma-backed one for the app — exactly mirroring
`PlanRepository`/`createInMemoryPlanRepository`/`createPrismaPlanRepository` (PLAN-002). No
changes to domain logic (`lib/stars/diagnosis.ts`, `lib/plan/generate.ts`,
`lib/stakeholders/classify.ts`, `lib/plan/edit.ts`, `lib/stakeholders/map.ts`) — this plan only
changes what stores and retrieves their inputs/outputs.

**`lib/stars/repository.ts` (new).** `DiagnosisRepository` adds an `id` to `DiagnosisRecord`
(as `PersistedDiagnosisRecord = DiagnosisRecord & { id: string }`) — a persistence-layer-only
extension, not a change to `lib/stars/override.ts`'s existing type or its tests. `id` is
needed because `Plan.diagnosisId` is a real Prisma foreign key (`prisma/schema.prisma`), and
`lib/plan/generate.ts`'s current `nextPlanId()` counter produces a value with no relationship
to any real `DiagnosisRecord` row — the wiring layer (not `generate.ts`) substitutes the real
id before saving.

**`lib/stakeholders/repository.ts` (new).** `StakeholderRepository` is `findAll()`/
`saveAll(stakeholders)` — a flat list, no map-level metadata persisted. `dataStatus`/
`skippedCount` stay computed at read time: today the app never actually calls the MCP client
(`store.ts`'s existing comment: the map "starts from an 'unavailable' MCP result... isn't
wired here" — a separate, already-acknowledged gap this plan does not touch), so
`StakeholdersPage` continues passing `{status: "unavailable"}` into the unchanged
`buildStakeholderMap()`, with the *manual* stakeholder array now sourced from
`StakeholderRepository.findAll()` instead of a module-level array.

**`lib/plan/repository.ts` (no production changes).** `createPrismaPlanRepository` already
exists and matches everything this plan needs — it has simply never been tested or called.
This plan adds the missing test coverage (AC-4.5) and wires `actions.ts` to call it.

**Shared Prisma client.** `app/app/_lib/prisma-client.ts` (new) exports a single
`getPrismaClient()` singleton (the standard Next.js `globalThis`-cached pattern, avoiding a
new client per server action invocation across the app's long-running Node process — distinct
from `api/readyz/route.ts`'s existing per-request `new PrismaClient()` + `$disconnect()`,
which is left as-is since it already works and touching it is outside this plan's scope).

**Wiring (`app/app/_lib/actions.ts`, `diagnosis|plan|stakeholders/page.tsx`).** Every action
swaps its `store.ts` get/set calls for the corresponding repository call; every page component
becomes `async function` (Next.js Server Components support this natively) and awaits its
repository read(s). `lastIntakeError`/`lastPlanError` are the only state that stays in
`store.ts` — transient, UI-only messages with no value surviving a restart (SPEC-004's Out of
Scope).

## Interfaces / contracts

```ts
// lib/stars/repository.ts
import type { StarsDiagnosis, StarsType } from "../inference/schemas/stars-diagnosis";
import type { DiagnosisRecord } from "./override";

export type PersistedDiagnosisRecord = DiagnosisRecord & { id: string };

export interface DiagnosisRepository {
  save(diagnosis: StarsDiagnosis, narrative: string): Promise<PersistedDiagnosisRecord>;
  applyOverride(id: string, correctedType: StarsType): Promise<PersistedDiagnosisRecord>;
  findLatest(): Promise<PersistedDiagnosisRecord | null>;
}

export function createInMemoryDiagnosisRepository(): DiagnosisRepository;

// Minimal shape needed from a generated Prisma client (same reasoning as
// lib/plan/repository.ts's PrismaPlanClient: this module never requires @prisma/client to
// actually be generated just to be imported).
export interface PrismaDiagnosisClient {
  diagnosisRecord: {
    create(args: unknown): Promise<PrismaDiagnosisRow>;
    update(args: unknown): Promise<PrismaDiagnosisRow>;
    findFirst(args: unknown): Promise<PrismaDiagnosisRow | null>;
  };
}
export function createPrismaDiagnosisRepository(client: PrismaDiagnosisClient): DiagnosisRepository;
```

```ts
// lib/stakeholders/repository.ts
import type { Stakeholder } from "./map";

export interface StakeholderRepository {
  findAll(): Promise<Stakeholder[]>;
  saveAll(stakeholders: Stakeholder[]): Promise<void>;
}

export function createInMemoryStakeholderRepository(): StakeholderRepository;

export interface PrismaStakeholderClient {
  stakeholder: {
    findMany(args: unknown): Promise<PrismaStakeholderRow[]>;
    upsert(args: unknown): Promise<PrismaStakeholderRow>;
  };
}
export function createPrismaStakeholderRepository(client: PrismaStakeholderClient): StakeholderRepository;
```

```ts
// app/app/_lib/prisma-client.ts
export function getPrismaClient(): PrismaClient; // singleton, globalThis-cached in dev
```

```ts
// app/app/_lib/actions.ts (changed call sites only — signatures unchanged, all still
// exported as (formData: FormData) => Promise<void> server actions)
submitIntakeAction:      diagnose(...) -> diagnosisRepository.save(diagnosis, narrative)
correctDiagnosisAction:  diagnosisRepository.applyOverride(record.id, correctedType)
generatePlanAction:      diagnosisRepository.findLatest() -> generatePlan(record) ->
                         planRepository.save({ ...plan, diagnosisId: record.id })
editMilestoneAction/
addMilestoneAction/
moveMilestoneAction:     planRepository.find(diagnosisId) -> edit.ts fn (unchanged) ->
                         planRepository.save(updated)
addStakeholderAction/
repositionStakeholderAction:
                         stakeholderRepository.findAll() -> map.ts fn (unchanged) ->
                         stakeholderRepository.saveAll(updated.stakeholders)
```

## Tradeoffs considered

- **`id` living on a persistence-only extended type vs. adding `id?` to `DiagnosisRecord`
  itself.** The extended-type approach (`PersistedDiagnosisRecord`) was chosen so
  `lib/stars/override.ts` and its existing tests (`override.spec.ts`) stay untouched — the
  domain type's job is describing a diagnosis's content, not its storage identity.
- **Per-row upsert vs. delete-all-then-recreate for stakeholders.** `PlanRepository`'s Prisma
  implementation deletes-and-recreates milestones because they're a single plan's owned
  subresource (`deleteMany({})` scoped to one `planId`). Stakeholders are top-level rows with
  no natural parent scope, so a blanket `deleteMany({})` would wipe the whole table on every
  save — chose per-id `upsert` instead, which is what `createPrismaPlanRepository`'s own
  top-level `plan.upsert()` call already does for the `Plan` row itself.
- **Singleton Prisma client vs. matching `readyz`'s per-request pattern.** A per-request
  `new PrismaClient()` (readyz's pattern) is the recommended shape for short-lived
  serverless/edge invocations; this app's server actions run inside one long-lived Node
  process (`docker-compose.yml`'s `app` service), where repeated client construction without
  disconnecting risks exhausting Postgres's connection pool over a session. A singleton is the
  standard, Prisma-documented pattern for that deployment shape.

## Risks

- **`generatePlan()`'s `idFactory` becomes dead weight for the real (non-test) path.** Once
  the wiring layer always overwrites `plan.diagnosisId` with the real persisted id before
  saving, `nextPlanId()`'s counter-generated value is discarded on every real call — it only
  still matters for `lib/plan/generation.spec.ts`'s existing tests, which construct a `Plan`
  directly without going through this wiring. Not fixed here (would touch `generate.ts`,
  out of scope per SPEC-004) — worth a follow-up cleanup, not a correctness problem now.
- **No transaction across `diagnosisRepository.save()` + first plan generation.** These remain
  two separate calls/requests (submit intake, then a later explicit "Generate plan" action),
  matching the existing UI flow — not a new risk this plan introduces, just carried over from
  the current design (SPEC-002's own "regeneration is always an explicit user action").
- **Manually-verified wiring, not unit-tested end to end.** Per SPEC-004's Out of Scope, the
  actual cross-route fix (the user-visible bug) is verified via `docker compose up --build` +
  real browser interaction, the same precedent SPEC-000 set for the sidecar's live call — not
  a gap in this plan, but worth remembering when deciding a task is "done": repository tests
  passing is necessary, not sufficient: the docker compose full run below must genuinely
  pass to close this bug.
- **DB unavailability outside the two guarded actions (`submitIntakeAction`,
  `generatePlanAction`) surfaces as an unhandled server-action rejection or page-render
  error, not a friendly message** — an accepted risk for this capstone's demo scope,
  operationally visible via `/api/readyz`. Not fixed here; would need revisiting for a real
  deployment.
