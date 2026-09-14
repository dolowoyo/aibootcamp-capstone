import { z, type ZodType } from "zod";

/**
 * Shape of a raw stakeholder record coming back from the MCP client (SPEC-003, PLAN-003).
 * A lightweight local schema — not part of `lib/inference/schemas/`, since this data doesn't
 * cross the LLM inference boundary; it comes from `mcp/onboarding-context` instead.
 */
export interface RawStakeholderRecord {
  id: string;
  name: string;
  influence?: number; // 1-10; absent -> incomplete record (AC-3.7)
  support?: number; // 1-10; absent -> incomplete record (AC-3.7)
}

export const rawStakeholderRecordSchema: ZodType<RawStakeholderRecord> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  influence: z.number().min(1).max(10).optional(),
  support: z.number().min(1).max(10).optional(),
});

/** A record is "complete" (usable for AC-3.1 classification) only once both fields exist. */
export function isCompleteStakeholderRecord(
  record: RawStakeholderRecord
): record is RawStakeholderRecord & { influence: number; support: number } {
  return typeof record.influence === "number" && typeof record.support === "number";
}
