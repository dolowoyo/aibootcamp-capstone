import type { Plan } from "../inference/schemas/plan";

/**
 * Persistence seam for a `Plan` (PLAN-002: "the calling API route persists the result via
 * the existing Prisma-backed Plan/Milestone models"). Kept as a swappable interface — same
 * reasoning as SPEC-000's provider adapters — so `lib/plan/edit.ts`'s pure functions can be
 * proven to "persist on subsequent retrieval" (AC-2.4/AC-2.5/AC-2.6) deterministically in
 * tests, without every test run requiring a live Postgres connection. The app's API routes
 * use `createPrismaPlanRepository()` against the real database; tests use
 * `createInMemoryPlanRepository()`.
 */
export interface PlanRepository {
  save(plan: Plan): Promise<void>;
  find(diagnosisId: string): Promise<Plan | null>;
}

export function createInMemoryPlanRepository(): PlanRepository {
  const store = new Map<string, Plan>();
  return {
    async save(plan: Plan) {
      store.set(plan.diagnosisId, JSON.parse(JSON.stringify(plan)) as Plan);
    },
    async find(diagnosisId: string) {
      const found = store.get(diagnosisId);
      return found ? (JSON.parse(JSON.stringify(found)) as Plan) : null;
    },
  };
}

/**
 * The minimal shape this repository needs from a generated Prisma client, so this module
 * never requires `@prisma/client` to actually be generated just to be imported (tests never
 * exercise this path — see `lib/plan/editing.spec.ts`, which uses the in-memory repository).
 */
export interface PrismaPlanClient {
  plan: {
    upsert(args: unknown): Promise<unknown>;
    findUnique(args: unknown): Promise<{
      diagnosisId: string;
      milestones: Array<{
        externalId: string;
        phase: string;
        order: number;
        text: string;
        rationale: string;
      }>;
    } | null>;
  };
}

export function createPrismaPlanRepository(prismaClient: PrismaPlanClient): PlanRepository {
  return {
    async save(plan: Plan) {
      await prismaClient.plan.upsert({
        where: { diagnosisId: plan.diagnosisId },
        create: {
          diagnosisId: plan.diagnosisId,
          milestones: {
            create: plan.milestones.map((m) => ({
              externalId: m.id,
              phase: m.phase,
              order: m.order,
              text: m.text,
              rationale: m.rationale,
            })),
          },
        },
        update: {
          milestones: {
            deleteMany: {},
            create: plan.milestones.map((m) => ({
              externalId: m.id,
              phase: m.phase,
              order: m.order,
              text: m.text,
              rationale: m.rationale,
            })),
          },
        },
        include: { milestones: true },
      });
    },
    async find(diagnosisId: string) {
      const record = await prismaClient.plan.findUnique({
        where: { diagnosisId },
        include: { milestones: true },
      });
      if (!record) return null;
      return {
        diagnosisId: record.diagnosisId,
        milestones: record.milestones
          .map((m) => ({
            id: m.externalId,
            phase: m.phase,
            order: m.order,
            text: m.text,
            rationale: m.rationale,
          }))
          .sort((a, b) => a.order - b.order),
      } as Plan;
    },
  };
}
