import { describe, expect, it } from "vitest";
import { exportPlan } from "./export";
import { addMilestone, editMilestoneText } from "./edit";
import type { Plan } from "../inference/schemas/plan";

function samplePlan(): Plan {
  return {
    diagnosisId: "diagnosis-export-test",
    milestones: [
      { id: "m1", phase: "1-30", order: 0, text: "assess the landscape", rationale: "r1" },
      { id: "m2", phase: "31-60", order: 0, text: "ship a first win", rationale: "r2" },
      { id: "m3", phase: "61-90", order: 0, text: "formalize the charter", rationale: "r3" },
    ],
  };
}

describe("plan export", () => {
  it("exporting the current plan reflects all three phases and all edits made to it", () => {
    let plan = samplePlan();
    plan = editMilestoneText(plan, "m1", "assess the landscape (revised)");
    plan = addMilestone(plan, "31-60", "brand new milestone", "new rationale", () => "m-new");

    const exported = exportPlan(plan);

    expect(exported).toContain("Days 1-30");
    expect(exported).toContain("Days 31-60");
    expect(exported).toContain("Days 61-90");
    expect(exported).toContain("assess the landscape (revised)");
    expect(exported).toContain("brand new milestone");
    expect(exported).toContain("ship a first win");
    expect(exported).toContain("formalize the charter");
  });
});
