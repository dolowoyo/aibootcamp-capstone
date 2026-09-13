import { describe, expect, it } from "vitest";
import { validateIntake, IntakeValidationError } from "./intake";

describe("intake validation", () => {
  it("rejects a narrative under 50 characters with a field-level error naming narrative", () => {
    const shortNarrative = "too short";
    expect(shortNarrative.length).toBeLessThan(50);

    let caught: unknown;
    try {
      validateIntake({ narrative: shortNarrative });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(IntakeValidationError);
    expect((caught as IntakeValidationError).field).toBe("narrative");
  });

  it("accepts a narrative of at least 50 characters without throwing", () => {
    const longEnough = "a".repeat(50);
    expect(() => validateIntake({ narrative: longEnough })).not.toThrow();
  });
});
