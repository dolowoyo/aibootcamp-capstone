import { getPrismaClient } from "./prisma-client";
import { createPrismaDiagnosisRepository } from "@lib/stars/repository";
import { createPrismaPlanRepository, type PrismaPlanClient } from "@lib/plan/repository";
import { createPrismaStakeholderRepository } from "@lib/stakeholders/repository";
import { buildStakeholderMap, type StakeholderMap } from "@lib/stakeholders/map";

/**
 * Repository singletons wired against the shared `PrismaClient` (see `./prisma-client`).
 * `actions.ts` and the page components import these ready-to-use instances rather than each
 * constructing their own repository, which would defeat the singleton `PrismaClient`.
 */
export const diagnosisRepository = createPrismaDiagnosisRepository(getPrismaClient());
/**
 * `PrismaPlanClient.plan.findUnique`'s return type is a plain `Promise<{...milestones}>`, but
 * the real generated Prisma client's `findUnique` is a generic "fluent" method whose payload
 * type depends on the `include`/`select` argument passed at each call site. TypeScript erases
 * that generic to its unresolved constraint when structurally checking it against a
 * non-generic method signature, which drops the `milestones` relation and fails the
 * assignability check. The cast here is a narrow, call-site-only bridge between the real
 * client and this deliberately minimal interface (see `lib/plan/repository.ts`'s own comment
 * on `PrismaPlanClient`); `find()`'s `include: { milestones: true }` call still runs correctly
 * against the real client at runtime, so no behavior is affected.
 */
export const planRepository = createPrismaPlanRepository(
  getPrismaClient() as unknown as PrismaPlanClient,
);
export const stakeholderRepository = createPrismaStakeholderRepository(getPrismaClient());

/**
 * Loads all persisted stakeholders and rebuilds the current `StakeholderMap` from them.
 * `buildStakeholderMap`'s second argument is documented as the *manual* list only (see
 * `lib/stakeholders/map.ts`) -- once MCP fetching is actually wired in (the `status:
 * "unavailable"` below is a placeholder for that future task), any MCP-sourced stakeholder
 * row that was previously persisted would otherwise be concatenated a second time alongside
 * the fresh MCP result. Filtering to `source === "manual"` here keeps that latent duplication
 * from ever surfacing. Centralized here (rather than duplicated in each call site) so
 * `actions.ts`'s stakeholder actions and `stakeholders/page.tsx` all share one implementation.
 */
export async function loadStakeholderMap(): Promise<StakeholderMap> {
  const stakeholders = await stakeholderRepository.findAll();
  return buildStakeholderMap(
    { status: "unavailable" },
    stakeholders.filter((s) => s.source === "manual")
  );
}
