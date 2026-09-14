/**
 * Intake validation (SPEC-001 AC-1.1, PLAN-001). Plain validation, not inference — never
 * touches the provider boundary, so it can run with zero dependency on `LLM_PROVIDER`.
 */

export const MIN_NARRATIVE_LENGTH = 50;

export interface StarsIntake {
  narrative: string;
}

export class IntakeValidationError extends Error {
  constructor(readonly field: string, message: string) {
    super(message);
    this.name = "IntakeValidationError";
  }
}

/** Throws `IntakeValidationError` naming the `narrative` field when it's too short. */
export function validateIntake(intake: StarsIntake): void {
  if (!intake.narrative || intake.narrative.length < MIN_NARRATIVE_LENGTH) {
    throw new IntakeValidationError(
      "narrative",
      `narrative must be at least ${MIN_NARRATIVE_LENGTH} characters (received ${
        intake.narrative?.length ?? 0
      })`
    );
  }
}
