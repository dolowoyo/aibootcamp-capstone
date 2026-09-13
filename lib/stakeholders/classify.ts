export type Quadrant = "ally" | "opponent" | "keep-informed" | "monitor";

const MIDPOINT = 5.5;

/**
 * Tie-break rule (PLAN-003, resolving SPEC-003's flagged open question about boundary
 * values): a score of exactly the 5.5 midpoint resolves to the *lower* side of that axis, so
 * `classifyQuadrant` is decidable at every input value — no score can land on an undefined
 * boundary.
 */
function isHighSide(score: number): boolean {
  return score > MIDPOINT;
}

/** Scale: 1-10 on each axis. See `isHighSide`'s doc comment for the tie-break rule. */
export function classifyQuadrant(influence: number, support: number): Quadrant {
  const highInfluence = isHighSide(influence);
  const highSupport = isHighSide(support);

  if (highInfluence && highSupport) return "ally";
  if (highInfluence && !highSupport) return "opponent";
  if (!highInfluence && highSupport) return "keep-informed";
  return "monitor";
}

/** Each quadrant's distinct, recommended posture (SPEC-003 AC-3.2). */
export const QUADRANT_POSTURE: Record<Quadrant, string> = {
  ally: "leverage",
  opponent: "convert-or-neutralize",
  "keep-informed": "keep-informed",
  monitor: "monitor",
};
