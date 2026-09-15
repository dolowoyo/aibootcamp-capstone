/**
 * In-memory, single-process demo state -- now scoped to transient UI error messages only.
 * The diagnosis record, plan, and stakeholder map are persisted via the Prisma-backed
 * repositories in `./prisma-instances` (SPEC-004), so this store no longer holds them. Error
 * messages surfaced by a failed intake/plan-generation attempt have no persistence value
 * (SPEC-004's Out of Scope), so they stay here as simple in-memory state.
 */

let lastIntakeError: string | null = null;
let lastPlanError: string | null = null;

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
