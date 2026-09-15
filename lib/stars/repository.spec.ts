import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createInMemoryDiagnosisRepository,
  createPrismaDiagnosisRepository,
  type PrismaDiagnosisClient,
} from "./repository";
import type { StarsDiagnosis } from "../inference/schemas/stars-diagnosis";

// Mock the Prisma boundary so this unit test never requires a live Postgres
// connection (per the project's determinism-at-the-boundary convention --
// mirrors app/app/api/readyz/route.spec.ts's approach).
const createMock = vi.fn();
const updateMock = vi.fn();
const findFirstMock = vi.fn();

const mockClient: PrismaDiagnosisClient = {
  diagnosisRecord: {
    create: createMock,
    update: updateMock,
    findFirst: findFirstMock,
  },
};

const diagnosis: StarsDiagnosis = {
  dominantType: "startup",
  confidence: "high",
  rationale: "building something new",
  evidence: ["no existing team", "no existing product"],
};

describe("diagnosis repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("saving a diagnosis and retrieving it via a separate repository instance returns the same effective type", async () => {
    const savedRow = {
      id: "diagnosis-1",
      narrative: "starting a brand new team",
      dominantType: diagnosis.dominantType,
      secondaryType: null,
      confidence: diagnosis.confidence,
      rationale: diagnosis.rationale,
      evidence: diagnosis.evidence,
      override: null,
    };
    createMock.mockResolvedValueOnce(savedRow);
    findFirstMock.mockResolvedValueOnce(savedRow);

    const writer = createPrismaDiagnosisRepository(mockClient);
    const saved = await writer.save(diagnosis, "starting a brand new team");

    // A separately constructed instance, mirroring what a second process/route would see.
    const reader = createPrismaDiagnosisRepository(mockClient);
    const found = await reader.findLatest();

    expect(found).not.toBeNull();
    expect(found?.effectiveType).toBe(saved.effectiveType);
    expect(found?.effectiveType).toBe("startup");
  });

  it("a correction saved via the repository is reflected in a separate instance's retrieval", async () => {
    const updatedRow = {
      id: "diagnosis-1",
      narrative: "starting a brand new team",
      dominantType: diagnosis.dominantType,
      secondaryType: null,
      confidence: diagnosis.confidence,
      rationale: diagnosis.rationale,
      evidence: diagnosis.evidence,
      override: "turnaround",
    };
    updateMock.mockResolvedValueOnce(updatedRow);

    const writer = createPrismaDiagnosisRepository(mockClient);
    await writer.applyOverride("diagnosis-1", "turnaround");

    findFirstMock.mockResolvedValueOnce(updatedRow);
    const reader = createPrismaDiagnosisRepository(mockClient);
    const found = await reader.findLatest();

    expect(found?.effectiveType).toBe("turnaround");
    expect(found?.effectiveType).not.toBe(diagnosis.dominantType);
  });

  it("retrieval returns the most recently saved diagnosis when multiple exist", async () => {
    const latestRow = {
      id: "diagnosis-2",
      narrative: "second narrative",
      dominantType: "realignment",
      secondaryType: null,
      confidence: "medium",
      rationale: "the most recently saved diagnosis",
      evidence: ["latest evidence"],
      override: null,
    };
    findFirstMock.mockResolvedValueOnce(latestRow);

    const repo = createPrismaDiagnosisRepository(mockClient);
    const found = await repo.findLatest();

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );
    expect(found?.effectiveType).toBe("realignment");
    expect(found?.id).toBe("diagnosis-2");
  });

  it("retrieval returns null when no diagnosis has been saved", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    const repo = createPrismaDiagnosisRepository(mockClient);
    const found = await repo.findLatest();

    expect(found).toBeNull();
  });
});

describe("in-memory diagnosis repository", () => {
  it("saves a diagnosis and returns it as the latest via findLatest", async () => {
    const repo = createInMemoryDiagnosisRepository();

    const saved = await repo.save(diagnosis, "starting a brand new team");
    const found = await repo.findLatest();

    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.effectiveType).toBe("startup");
  });

  it("applies an override by id and reflects it in the effective type", async () => {
    const repo = createInMemoryDiagnosisRepository();
    const saved = await repo.save(diagnosis, "starting a brand new team");

    const corrected = await repo.applyOverride(saved.id, "turnaround");

    expect(corrected.effectiveType).toBe("turnaround");
    const found = await repo.findLatest();
    expect(found?.effectiveType).toBe("turnaround");
  });
});
