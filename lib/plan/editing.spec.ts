import { describe, expect, it } from "vitest";
import { addMilestone, editMilestoneText, moveMilestone } from "./edit";
import { createInMemoryPlanRepository } from "./repository";
import type { Plan } from "../inference/schemas/plan";

const DIAGNOSIS_ID = "diagnosis-editing-test";

function samplePlan(): Plan {
  return {
    diagnosisId: DIAGNOSIS_ID,
    milestones: [
      { id: "m1", phase: "1-30", order: 0, text: "original text", rationale: "r1" },
      { id: "m2", phase: "1-30", order: 1, text: "second milestone", rationale: "r2" },
      { id: "m3", phase: "31-60", order: 0, text: "third milestone", rationale: "r3" },
    ],
  };
}

describe("plan editing", () => {
  it("editing a milestone's text persists on subsequent retrieval", async () => {
    const repository = createInMemoryPlanRepository();
    await repository.save(samplePlan());

    const current = await repository.find(DIAGNOSIS_ID);
    const edited = editMilestoneText(current!, "m1", "revised text");
    await repository.save(edited);

    const retrieved = await repository.find(DIAGNOSIS_ID);
    expect(retrieved!.milestones.find((m) => m.id === "m1")!.text).toBe("revised text");
  });

  it("adding a milestone to a phase persists on subsequent retrieval", async () => {
    const repository = createInMemoryPlanRepository();
    await repository.save(samplePlan());

    const current = await repository.find(DIAGNOSIS_ID);
    const updated = addMilestone(current!, "61-90", "new milestone", "new rationale", () => "m-new");
    await repository.save(updated);

    const retrieved = await repository.find(DIAGNOSIS_ID);
    const added = retrieved!.milestones.find((m) => m.id === "m-new");
    expect(added).toBeDefined();
    expect(added!.phase).toBe("61-90");
    expect(added!.text).toBe("new milestone");
  });

  it("moving a milestone to a different phase or position persists on subsequent retrieval", async () => {
    const repository = createInMemoryPlanRepository();
    await repository.save(samplePlan());

    const current = await repository.find(DIAGNOSIS_ID);
    const moved = moveMilestone(current!, "m1", "31-60", 0);
    await repository.save(moved);

    const retrieved = await repository.find(DIAGNOSIS_ID);
    const movedMilestone = retrieved!.milestones.find((m) => m.id === "m1");
    expect(movedMilestone!.phase).toBe("31-60");
    expect(movedMilestone!.order).toBe(0);
  });
});
