import type { DiagnosisRecord } from "@lib/stars/override";
import type { Plan } from "@lib/inference/schemas/plan";
import type { StakeholderMap } from "@lib/stakeholders/map";
import { buildStakeholderMap } from "@lib/stakeholders/map";

/**
 * In-memory, single-process demo state. This capstone slice has no auth/multi-user
 * concept, so a simple module-level store stands in for a session. The domain layer
 * already exposes a real, swappable persistence seam (`lib/plan/repository.ts`'s
 * `PlanRepository`, and `prisma/schema.prisma`'s `DiagnosisRecord`/`Plan`/`Milestone`/
 * `Stakeholder` models) — wiring the UI to the Prisma-backed repository instead of this
 * store is a follow-up, not a change to the tested domain contract. Deliberately simple
 * per this build's "functional, not polished" scope.
 *
 * The stakeholder map starts from an "unavailable" MCP result: the real
 * `mcp/onboarding-context` server is a different worktree's deliverable (Block 2) and isn't
 * wired here — this honestly exercises AC-3.6's graceful-degradation path (empty map,
 * visible notice, manual add still works) until Block 3 integration wires the real source.
 */

let diagnosisRecord: DiagnosisRecord | null = null;
let plan: Plan | null = null;
let stakeholderMap: StakeholderMap = buildStakeholderMap({ status: "unavailable" });
let lastIntakeError: string | null = null;
let lastPlanError: string | null = null;

export function getDiagnosisRecord(): DiagnosisRecord | null {
  return diagnosisRecord;
}
export function setDiagnosisRecord(record: DiagnosisRecord | null): void {
  diagnosisRecord = record;
}

export function getPlan(): Plan | null {
  return plan;
}
export function setPlan(next: Plan | null): void {
  plan = next;
}

export function getStakeholderMap(): StakeholderMap {
  return stakeholderMap;
}
export function setStakeholderMap(next: StakeholderMap): void {
  stakeholderMap = next;
}

export function getLastIntakeError(): string | null {
  return lastIntakeError;
}
export function setLastIntakeError(message: string | null): void {
  lastIntakeError = message;
}

export function getLastPlanError(): string | null {
  return lastPlanError;
}
export function setLastPlanError(message: string | null): void {
  lastPlanError = message;
}
