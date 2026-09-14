import { describe, expect, it } from "vitest";
import { diagnose } from "./diagnosis";
import { FixtureProvider } from "../inference/adapters/fixture";
import { STARS_TYPES, CONFIDENCE_LEVELS } from "../inference/schemas/stars-diagnosis";
import startupFixture from "../../fixtures/inference/stars/startup.json";
import blendedFixture from "../../fixtures/inference/stars/blended-turnaround-realignment.json";
import thinFixture from "../../fixtures/inference/stars/thin-ambiguous.json";

const provider = new FixtureProvider();

describe("STARS classification", () => {
  it("returns exactly one dominant STARS type for a valid narrative", async () => {
    const diagnosis = await diagnose({ narrative: startupFixture.narrative }, provider);
    expect(STARS_TYPES).toContain(diagnosis.dominantType);
    expect(typeof diagnosis.dominantType).toBe("string");
  });

  it("rationale references specific content from the submitted narrative", async () => {
    const diagnosis = await diagnose({ narrative: startupFixture.narrative }, provider);
    // Every evidence entry is a literal substring of the narrative (PLAN-001's convention);
    // proving the rationale itself quotes/paraphrases at least one is the AC-1.3 check.
    const rationaleReferencesNarrative = diagnosis.evidence.some((excerpt) =>
      diagnosis.rationale.includes(excerpt)
    );
    expect(rationaleReferencesNarrative).toBe(true);
  });

  it("diagnosis includes a confidence level drawn from a fixed set", async () => {
    const diagnosis = await diagnose({ narrative: startupFixture.narrative }, provider);
    expect(CONFIDENCE_LEVELS).toContain(diagnosis.confidence);
  });

  it("diagnosis includes at least one evidence excerpt from the narrative", async () => {
    const diagnosis = await diagnose({ narrative: startupFixture.narrative }, provider);
    expect(diagnosis.evidence.length).toBeGreaterThan(0);
    expect(
      diagnosis.evidence.every((excerpt) => startupFixture.narrative.includes(excerpt))
    ).toBe(true);
  });
});

describe("blended situations", () => {
  it("returns a distinct secondary type only when narrative evidence supports a second situation type", async () => {
    const blended = await diagnose({ narrative: blendedFixture.narrative }, provider);
    expect(blended.secondaryType).toBeDefined();
    expect(blended.secondaryType).not.toBe(blended.dominantType);

    const nonBlended = await diagnose({ narrative: startupFixture.narrative }, provider);
    expect(nonBlended.secondaryType).toBeUndefined();
  });
});

describe("ambiguous input handling", () => {
  it("a thin but valid narrative returns Low confidence with an explicit limited-evidence rationale", async () => {
    expect(thinFixture.narrative.length).toBeGreaterThanOrEqual(50);
    const diagnosis = await diagnose({ narrative: thinFixture.narrative }, provider);
    expect(diagnosis.confidence).toBe("low");
    expect(diagnosis.rationale.toLowerCase()).toContain("limited evidence");
  });
});
