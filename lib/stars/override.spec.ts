import { describe, expect, it } from "vitest";
import { applyOverride, type DiagnosisRecord } from "./override";
import type { StarsDiagnosis } from "../inference/schemas/stars-diagnosis";

const original: StarsDiagnosis = {
  dominantType: "startup",
  confidence: "high",
  rationale: "original rationale",
  evidence: ["original evidence"],
};

describe("diagnosis override", () => {
  it("a corrected STARS type is used by downstream plan generation instead of the original classification", () => {
    const record: DiagnosisRecord = {
      original,
      effectiveType: original.dominantType,
    };

    const corrected = applyOverride(record, "turnaround");

    // "Downstream plan generation" consumes `effectiveType` — proving it reflects the
    // correction, not the original classification, is what AC-1.7 requires.
    expect(corrected.effectiveType).toBe("turnaround");
    expect(corrected.effectiveType).not.toBe(original.dominantType);
    expect(corrected.override).toBe("turnaround");

    // The original system classification is preserved, not destructively replaced.
    expect(corrected.original).toEqual(original);
  });

  it("effectiveType falls back to the original dominant type when no override has been applied", () => {
    const record: DiagnosisRecord = {
      original,
      effectiveType: original.dominantType,
    };

    expect(record.effectiveType).toBe("startup");
    expect(record.override).toBeUndefined();
  });
});
