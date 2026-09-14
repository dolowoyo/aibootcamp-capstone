/**
 * Plan/Milestone schema — SPEC-002's own deliverable (PLAN-002), living at the shared
 * inference-boundary schema location PLAN-000 establishes.
 */
import { z, type ZodType } from "zod";

export const PHASES = ["1-30", "31-60", "61-90"] as const;
export type Phase = (typeof PHASES)[number];

export interface Milestone {
  id: string;
  phase: Phase;
  order: number;
  text: string;
  rationale: string;
}

export interface Plan {
  diagnosisId: string;
  milestones: Milestone[];
}

export const milestoneSchema: ZodType<Milestone> = z.object({
  id: z.string().min(1),
  phase: z.enum(PHASES),
  order: z.number().int().nonnegative(),
  text: z.string().min(1),
  rationale: z.string().min(1),
});

export const planSchema: ZodType<Plan> = z.object({
  diagnosisId: z.string().min(1),
  milestones: z.array(milestoneSchema),
});
