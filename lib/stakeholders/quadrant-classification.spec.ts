import { describe, expect, it } from "vitest";
import { classifyQuadrant, QUADRANT_POSTURE, type Quadrant } from "./classify";

describe("quadrant classification", () => {
  it("every stakeholder renders into exactly one of the four influence x support quadrants", () => {
    const validQuadrants: Quadrant[] = ["ally", "opponent", "keep-informed", "monitor"];

    const samples: Array<{ influence: number; support: number }> = [
      { influence: 9, support: 9 },
      { influence: 9, support: 2 },
      { influence: 2, support: 9 },
      { influence: 2, support: 2 },
      { influence: 1, support: 10 },
      { influence: 10, support: 1 },
    ];

    for (const s of samples) {
      const quadrant = classifyQuadrant(s.influence, s.support);
      expect(validQuadrants).toContain(quadrant);
    }

    // Boundary/tie-break case (PLAN-003): exactly at the 5.5 midpoint on both axes still
    // resolves to a single, deterministic quadrant rather than an undefined result.
    const tieQuadrant = classifyQuadrant(5.5, 5.5);
    expect(validQuadrants).toContain(tieQuadrant);
    expect(classifyQuadrant(5.5, 5.5)).toBe(tieQuadrant); // deterministic, not random
  });
});

describe("quadrant posture", () => {
  it("each quadrant displays a distinct recommended posture inherited by its stakeholders", () => {
    const expectedPosture: Record<Quadrant, string> = {
      ally: "leverage",
      opponent: "convert-or-neutralize",
      "keep-informed": "keep-informed",
      monitor: "monitor",
    };

    // Distinct across all four quadrants.
    expect(new Set(Object.values(QUADRANT_POSTURE)).size).toBe(4);

    const stakeholders = [
      { name: "Ally Anna", influence: 9, support: 9 },
      { name: "Opponent Omar", influence: 9, support: 2 },
      { name: "Keep-informed Kim", influence: 2, support: 9 },
      { name: "Monitor Max", influence: 2, support: 2 },
    ].map((s) => ({ ...s, quadrant: classifyQuadrant(s.influence, s.support) }));

    for (const s of stakeholders) {
      expect(QUADRANT_POSTURE[s.quadrant]).toBe(expectedPosture[s.quadrant]);
    }
  });
});
