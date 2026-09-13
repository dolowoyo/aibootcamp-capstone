import type { InferenceProvider } from "../inference/provider";
import { createProvider } from "../inference/provider-factory";
import type { Plan } from "../inference/schemas/plan";
import type { DiagnosisRecord } from "../stars/override";

/**
 * Thrown when plan generation is requested with no STARS diagnosis to shape it (SPEC-002
 * AC-2.8) — a precondition check, never a provider-level failure.
 */
export class MissingDiagnosisError extends Error {
  constructor(message = "A STARS diagnosis is required before a plan can be generated.") {
    super(message);
    this.name = "MissingDiagnosisError";
  }
}

let planIdCounter = 0;

/** Injectable so callers/tests can supply a deterministic ID generator (PLAN-002). */
export function nextPlanId(): string {
  planIdCounter += 1;
  return `diagnosis-${planIdCounter}`;
}

export async function generatePlan(
  diagnosis: DiagnosisRecord | null | undefined,
  provider: InferenceProvider = createProvider(),
  idFactory: () => string = nextPlanId
): Promise<Plan> {
  if (!diagnosis) {
    throw new MissingDiagnosisError();
  }

  const milestones = await provider.generatePlan({ dominantType: diagnosis.effectiveType });

  return {
    diagnosisId: idFactory(),
    milestones,
  };
}
