import { describe, expect, it } from "vitest";
import { generatePlan, MissingDiagnosisError } from "./generate";
import { FixtureProvider } from "../inference/adapters/fixture";
import type { DiagnosisRecord } from "../stars/override";
import { PHASES } from "../inference/schemas/plan";

const provider = new FixtureProvider();

function diagnosisRecord(effectiveType: DiagnosisRecord["effectiveType"]): DiagnosisRecord {
  return {
    original: {
      dominantType: effectiveType,
      confidence: "high",
      rationale: "test rationale",
      evidence: ["test evidence"],
    },
    effectiveType,
  };
}

describe("plan generation", () => {
  it("returns milestones grouped into Days 1-30, 31-60, and 61-90 phases", async () => {
    const plan = await generatePlan(diagnosisRecord("startup"), provider);
    const phasesPresent = new Set(plan.milestones.map((m) => m.phase));
    expect(phasesPresent).toEqual(new Set(PHASES));
  });

  it("Day 1-30 milestones differ between a Startup diagnosis and a Turnaround diagnosis", async () => {
    const startupPlan = await generatePlan(diagnosisRecord("startup"), provider);
    const turnaroundPlan = await generatePlan(diagnosisRecord("turnaround"), provider);

    const startupDay1to30 = startupPlan.milestones
      .filter((m) => m.phase === "1-30")
      .map((m) => m.text)
      .sort();
    const turnaroundDay1to30 = turnaroundPlan.milestones
      .filter((m) => m.phase === "1-30")
      .map((m) => m.text)
      .sort();

    expect(startupDay1to30).not.toEqual(turnaroundDay1to30);
    const overlap = startupDay1to30.filter((t) => turnaroundDay1to30.includes(t));
    expect(overlap.length).toBe(0);
  });

  it("every milestone includes a rationale referencing the diagnosis situation type", async () => {
    const plan = await generatePlan(diagnosisRecord("turnaround"), provider);
    for (const milestone of plan.milestones) {
      expect(milestone.rationale.length).toBeGreaterThan(0);
      expect(milestone.rationale.toLowerCase()).toContain("turnaround");
    }
  });

  it("requesting a plan with no existing diagnosis is rejected with a distinguishable error", async () => {
    await expect(generatePlan(null, provider)).rejects.toBeInstanceOf(MissingDiagnosisError);
    await expect(generatePlan(undefined, provider)).rejects.toBeInstanceOf(MissingDiagnosisError);
  });
});
