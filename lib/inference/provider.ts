import type { StarsDiagnosis } from "./schemas/stars-diagnosis";
import type { Milestone } from "./schemas/plan";

/**
 * The one interface every inference adapter (fixture, sidecar, anthropic) satisfies
 * (SPEC-000 AC-0.1). Callers depend on this shape only, never on a concrete adapter.
 */
export interface InferenceProvider {
  diagnoseStars(intake: unknown): Promise<StarsDiagnosis>;
  generatePlan(diagnosis: unknown): Promise<Milestone[]>;
}

export { createProvider } from "./provider-factory";
