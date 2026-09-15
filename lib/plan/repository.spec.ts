import { afterEach, describe, expect, it, vi } from "vitest";
import { createPrismaPlanRepository, type PrismaPlanClient } from "./repository";
import type { Plan } from "../inference/schemas/plan";

// Mock the Prisma boundary so this unit test never requires a live Postgres
// connection (per the project's determinism-at-the-boundary convention --
// mirrors app/app/api/readyz/route.spec.ts's and lib/stars/repository.spec.ts's approach).
const upsertMock = vi.fn();
const findUniqueMock = vi.fn();

const mockClient: PrismaPlanClient = {
  plan: {
    upsert: upsertMock,
    findUnique: findUniqueMock,
  },
};

const plan: Plan = {
  diagnosisId: "diagnosis-plan-test",
  milestones: [
    { id: "m-b", phase: "31-60", order: 1, text: "second milestone", rationale: "r-b" },
    { id: "m-a", phase: "1-30", order: 0, text: "first milestone", rationale: "r-a" },
  ],
};

describe("plan repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("the Prisma-backed repository returns a saved plan via a separately constructed instance", async () => {
    upsertMock.mockResolvedValueOnce({ diagnosisId: plan.diagnosisId });

    const writer = createPrismaPlanRepository(mockClient);
    await writer.save(plan);

    // The row findUnique would return, deliberately in the same (unsorted-by-order)
    // sequence as `plan.milestones` above, so this test actually proves find() sorts
    // rather than merely echoing an already-sorted fixture.
    findUniqueMock.mockResolvedValueOnce({
      diagnosisId: plan.diagnosisId,
      milestones: [
        { externalId: "m-b", phase: "31-60", order: 1, text: "second milestone", rationale: "r-b" },
        { externalId: "m-a", phase: "1-30", order: 0, text: "first milestone", rationale: "r-a" },
      ],
    });

    // A separately constructed instance, mirroring what a second process/route would see.
    const reader = createPrismaPlanRepository(mockClient);
    const found = await reader.find(plan.diagnosisId);

    expect(found).toEqual({
      diagnosisId: plan.diagnosisId,
      milestones: [
        { id: "m-a", phase: "1-30", order: 0, text: "first milestone", rationale: "r-a" },
        { id: "m-b", phase: "31-60", order: 1, text: "second milestone", rationale: "r-b" },
      ],
    });
  });
});
