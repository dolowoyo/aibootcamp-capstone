/**
 * StarsDiagnosis schema — SPEC-001's own deliverable (PLAN-001), living at the shared
 * inference-boundary schema location PLAN-000 establishes.
 */
import { z, type ZodType } from "zod";

export const STARS_TYPES = [
  "startup",
  "turnaround",
  "accelerated-growth",
  "realignment",
  "sustaining-success",
] as const;
export type StarsType = (typeof STARS_TYPES)[number];

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export interface StarsDiagnosis {
  dominantType: StarsType;
  secondaryType?: StarsType;
  confidence: Confidence;
  rationale: string;
  evidence: string[];
}

export const starsDiagnosisSchema: ZodType<StarsDiagnosis> = z
  .object({
    dominantType: z.enum(STARS_TYPES),
    secondaryType: z.enum(STARS_TYPES).optional(),
    confidence: z.enum(CONFIDENCE_LEVELS),
    rationale: z.string().min(1),
    evidence: z.array(z.string().min(1)).min(1),
  })
  .refine((v) => v.secondaryType === undefined || v.secondaryType !== v.dominantType, {
    message: "secondaryType must be distinct from dominantType",
    path: ["secondaryType"],
  });
