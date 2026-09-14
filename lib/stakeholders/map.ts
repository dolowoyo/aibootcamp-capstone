import { classifyQuadrant, type Quadrant } from "./classify";
import type { RawStakeholderRecord } from "./schema";
import type { McpFetchResult } from "./mcp-client";

export interface Stakeholder extends RawStakeholderRecord {
  influence: number;
  support: number;
  quadrant: Quadrant;
  source: "mcp" | "manual";
}

export interface StakeholderMap {
  stakeholders: Stakeholder[];
  dataStatus: "ok" | "unavailable" | "partial";
  skippedCount?: number;
}

type CompleteRecord = RawStakeholderRecord & { influence: number; support: number };

function isComplete(record: RawStakeholderRecord): record is CompleteRecord {
  return typeof record.influence === "number" && typeof record.support === "number";
}

function toStakeholder(record: CompleteRecord, source: Stakeholder["source"]): Stakeholder {
  return {
    ...record,
    quadrant: classifyQuadrant(record.influence, record.support),
    source,
  };
}

/**
 * Merges MCP-sourced stakeholders with any manually added/repositioned ones, applying the
 * AC-3.6/AC-3.7 degradation rules (SPEC-003, PLAN-003).
 */
export function buildStakeholderMap(
  mcpResult: McpFetchResult,
  manual: Stakeholder[] = []
): StakeholderMap {
  if (mcpResult.status === "unavailable") {
    return { stakeholders: [...manual], dataStatus: "unavailable" };
  }

  const mcpStakeholders = mcpResult.stakeholders.filter(isComplete).map((r) => toStakeholder(r, "mcp"));

  if (mcpResult.status === "partial") {
    return {
      stakeholders: [...mcpStakeholders, ...manual],
      dataStatus: "partial",
      skippedCount: mcpResult.skippedCount,
    };
  }

  return { stakeholders: [...mcpStakeholders, ...manual], dataStatus: "ok" };
}

let manualIdCounter = 0;
function nextManualStakeholderId(): string {
  manualIdCounter += 1;
  return `manual-${manualIdCounter}`;
}

export type NewStakeholder = Omit<Stakeholder, "id" | "source" | "quadrant"> & { id?: string };

/** A user can add a net-new stakeholder (AC-3.4); quadrant is derived from influence/support. */
export function addStakeholder(
  map: StakeholderMap,
  s: NewStakeholder,
  idFactory: () => string = nextManualStakeholderId
): StakeholderMap {
  const newStakeholder: Stakeholder = {
    id: s.id ?? idFactory(),
    name: s.name,
    influence: s.influence,
    support: s.support,
    quadrant: classifyQuadrant(s.influence, s.support),
    source: "manual",
  };
  return { ...map, stakeholders: [...map.stakeholders, newStakeholder] };
}

/** A user can reassign an existing stakeholder to a different quadrant (AC-3.5). */
export function repositionStakeholder(
  map: StakeholderMap,
  id: string,
  quadrant: Quadrant
): StakeholderMap {
  return {
    ...map,
    stakeholders: map.stakeholders.map((s) => (s.id === id ? { ...s, quadrant } : s)),
  };
}
