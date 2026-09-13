import type { InferenceProvider } from "../inference/provider";
import { createProvider } from "../inference/provider-factory";
import type { StarsDiagnosis } from "../inference/schemas/stars-diagnosis";
import { validateIntake, type StarsIntake } from "./intake";

/**
 * Validates the intake (AC-1.1) then delegates to the active inference provider's
 * `diagnoseStars` (SPEC-000). The provider itself has already schema-validated its response
 * before it reaches this function.
 */
export async function diagnose(
  intake: StarsIntake,
  provider: InferenceProvider = createProvider()
): Promise<StarsDiagnosis> {
  validateIntake(intake);
  return provider.diagnoseStars(intake);
}
