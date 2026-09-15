import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createInMemoryStakeholderRepository,
  createPrismaStakeholderRepository,
  type PrismaStakeholderClient,
} from "./repository";
import type { Stakeholder } from "./map";

// Mock the Prisma boundary so this unit test never requires a live Postgres
// connection (per the project's determinism-at-the-boundary convention --
// mirrors lib/stars/repository.spec.ts's approach).
const findManyMock = vi.fn();
const upsertMock = vi.fn();

const mockClient: PrismaStakeholderClient = {
  stakeholder: {
    findMany: findManyMock,
    upsert: upsertMock,
  },
};

const stakeholder: Stakeholder = {
  id: "stakeholder-1",
  name: "Jordan Pierce",
  influence: 8,
  support: 7,
  quadrant: "ally",
  source: "manual",
};

describe("stakeholder repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("a saved stakeholder is included in a separate instance's retrieval", async () => {
    const savedRow = {
      id: stakeholder.id,
      name: stakeholder.name,
      influence: stakeholder.influence,
      support: stakeholder.support,
      quadrant: stakeholder.quadrant,
      source: stakeholder.source,
    };
    upsertMock.mockResolvedValueOnce(savedRow);

    const writer = createPrismaStakeholderRepository(mockClient);
    await writer.saveAll([stakeholder]);

    // Proves saveAll actually passed the stakeholder's data to Prisma's upsert, not just
    // that findAll's mocked return value round-trips correctly (see lib/stars/repository.spec.ts's
    // "retrieval returns the most recently saved diagnosis" test for the pattern this mirrors).
    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: stakeholder.id },
      create: {
        id: stakeholder.id,
        name: stakeholder.name,
        influence: stakeholder.influence,
        support: stakeholder.support,
        quadrant: stakeholder.quadrant,
        source: stakeholder.source,
      },
      update: {
        name: stakeholder.name,
        influence: stakeholder.influence,
        support: stakeholder.support,
        quadrant: stakeholder.quadrant,
        source: stakeholder.source,
      },
    });

    // A separately constructed instance, mirroring what a second process/route would see.
    findManyMock.mockResolvedValueOnce([savedRow]);
    const reader = createPrismaStakeholderRepository(mockClient);
    const found = await reader.findAll();

    expect(found).toContainEqual(
      expect.objectContaining({
        id: stakeholder.id,
        influence: stakeholder.influence,
        support: stakeholder.support,
        quadrant: stakeholder.quadrant,
      })
    );
  });

  it("a reposition saved via the repository is reflected in a separate instance's retrieval", async () => {
    const updatedRow = {
      id: stakeholder.id,
      name: stakeholder.name,
      influence: stakeholder.influence,
      support: stakeholder.support,
      quadrant: "opponent",
      source: stakeholder.source,
    };
    upsertMock.mockResolvedValueOnce(updatedRow);

    const writer = createPrismaStakeholderRepository(mockClient);
    await writer.saveAll([{ ...stakeholder, quadrant: "opponent" }]);

    // Proves the reposition was actually passed to Prisma's upsert, not just that findAll's
    // mocked return value round-trips correctly.
    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: stakeholder.id },
      create: {
        id: stakeholder.id,
        name: stakeholder.name,
        influence: stakeholder.influence,
        support: stakeholder.support,
        quadrant: "opponent",
        source: stakeholder.source,
      },
      update: {
        name: stakeholder.name,
        influence: stakeholder.influence,
        support: stakeholder.support,
        quadrant: "opponent",
        source: stakeholder.source,
      },
    });

    findManyMock.mockResolvedValueOnce([updatedRow]);
    const reader = createPrismaStakeholderRepository(mockClient);
    const found = await reader.findAll();

    const repositioned = found.find((s) => s.id === stakeholder.id);
    expect(repositioned?.quadrant).toBe("opponent");
    expect(repositioned?.quadrant).not.toBe("ally");
  });
});

describe("in-memory stakeholder repository", () => {
  it("saves a stakeholder and returns it via findAll", async () => {
    const repo = createInMemoryStakeholderRepository();

    await repo.saveAll([stakeholder]);
    const found = await repo.findAll();

    expect(found).toContainEqual(stakeholder);
  });

  it("a reposition (resaved by the same id) is reflected in findAll", async () => {
    const repo = createInMemoryStakeholderRepository();
    await repo.saveAll([stakeholder]);

    await repo.saveAll([{ ...stakeholder, quadrant: "opponent" }]);
    const found = await repo.findAll();

    expect(found).toHaveLength(1);
    expect(found[0]?.quadrant).toBe("opponent");
  });
});
