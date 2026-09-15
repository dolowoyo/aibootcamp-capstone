import type { Quadrant } from "./classify";
import type { Stakeholder } from "./map";

/**
 * Persistence seam for the stakeholder map (SPEC-004: stakeholder positions must survive
 * across routes/processes). Kept as a swappable interface -- same reasoning as
 * `lib/plan/repository.ts`'s `PlanRepository` -- so callers can be proven to "persist on
 * subsequent retrieval" (AC-4.6/AC-4.7) deterministically in tests, without every test run
 * requiring a live Postgres connection. The app's API routes use
 * `createPrismaStakeholderRepository()` against the real database; tests use
 * `createInMemoryStakeholderRepository()`.
 */
export interface StakeholderRepository {
  findAll(): Promise<Stakeholder[]>;
  /** Upserts every stakeholder in the list by its own id (not a batch/delete-all-then-recreate --
   * Stakeholder has no natural parent scope to delete-all within, unlike Plan's milestones
   * subresource, so a per-id upsert is the only safe way to save a subset without wiping the
   * rest of the table). */
  saveAll(stakeholders: Stakeholder[]): Promise<void>;
}

export function createInMemoryStakeholderRepository(): StakeholderRepository {
  const store = new Map<string, Stakeholder>();
  return {
    async findAll() {
      return JSON.parse(JSON.stringify(Array.from(store.values()))) as Stakeholder[];
    },
    async saveAll(stakeholders: Stakeholder[]) {
      for (const s of stakeholders) {
        store.set(s.id, JSON.parse(JSON.stringify(s)) as Stakeholder);
      }
    },
  };
}

/**
 * The minimal shape this repository needs from a generated Prisma client, so this module
 * never requires `@prisma/client` to actually be generated just to be imported (same
 * reasoning as `lib/plan/repository.ts`'s `PrismaPlanClient`).
 */
export interface PrismaStakeholderClient {
  stakeholder: {
    findMany(args: unknown): Promise<PrismaStakeholderRow[]>;
    upsert(args: unknown): Promise<PrismaStakeholderRow>;
  };
}

interface PrismaStakeholderRow {
  id: string;
  name: string;
  influence: number;
  support: number;
  quadrant: string;
  source: string;
}

function toStakeholder(row: PrismaStakeholderRow): Stakeholder {
  return {
    id: row.id,
    name: row.name,
    influence: row.influence,
    support: row.support,
    quadrant: row.quadrant as Quadrant,
    source: row.source as Stakeholder["source"],
  };
}

export function createPrismaStakeholderRepository(
  client: PrismaStakeholderClient
): StakeholderRepository {
  return {
    async findAll() {
      const rows = await client.stakeholder.findMany({});
      return rows.map(toStakeholder);
    },
    async saveAll(stakeholders: Stakeholder[]) {
      await Promise.all(
        stakeholders.map((s) =>
          client.stakeholder.upsert({
            where: { id: s.id },
            create: {
              id: s.id,
              name: s.name,
              influence: s.influence,
              support: s.support,
              quadrant: s.quadrant,
              source: s.source,
            },
            update: {
              name: s.name,
              influence: s.influence,
              support: s.support,
              quadrant: s.quadrant,
              source: s.source,
            },
          })
        )
      );
    },
  };
}
