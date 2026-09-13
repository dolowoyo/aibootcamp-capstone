import { describe, expect, it } from "vitest";
import { FixtureProvider } from "./fixture";

const STARTUP_NARRATIVE =
  "I'm stepping into a newly created VP of Data Platform role at a Series C fintech company. There is no existing data team, no analytics infrastructure, and no established roadmap to inherit — I'm building the function from scratch, hiring the first five engineers, and defining what 'good' looks like from zero. My CEO has asked me to stand up a greenfield data platform within two quarters, and there is no legacy system to migrate away from because nothing exists yet.";

describe("fixture adapter determinism", () => {
  it("diagnoseStars and generatePlan return deep-equal output across repeated calls with the same input", async () => {
    const provider = new FixtureProvider();
    const intake = { narrative: STARTUP_NARRATIVE };

    const diagnosisA = await provider.diagnoseStars(intake);
    const diagnosisB = await provider.diagnoseStars(intake);
    expect(diagnosisB).toEqual(diagnosisA);

    const planA = await provider.generatePlan(diagnosisA);
    const planB = await provider.generatePlan(diagnosisA);
    expect(planB).toEqual(planA);
  });

  it("output is unchanged with wall-clock time varied, random seed varied, and network access disabled", async () => {
    const provider = new FixtureProvider();
    const intake = { narrative: STARTUP_NARRATIVE };

    // Simulate wall-clock variation.
    const realNow = Date.now;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Date as any).now = () => 1_000_000;
    const diagnosisAtTimeA = await provider.diagnoseStars(intake);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Date as any).now = () => 2_000_000_000;
    const diagnosisAtTimeB = await provider.diagnoseStars(intake);
    Date.now = realNow;
    expect(diagnosisAtTimeB).toEqual(diagnosisAtTimeA);

    // Simulate random-seed variation.
    const realRandom = Math.random;
    Math.random = () => 0.1;
    const diagnosisSeedA = await provider.diagnoseStars(intake);
    Math.random = () => 0.9;
    const diagnosisSeedB = await provider.diagnoseStars(intake);
    Math.random = realRandom;
    expect(diagnosisSeedB).toEqual(diagnosisSeedA);

    // Simulate network unavailability — the fixture adapter never makes an outbound call,
    // so stubbing global fetch to always reject proves it isn't consulted.
    const realFetch = globalThis.fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = async () => {
      throw new Error("network access disabled for this test");
    };
    const diagnosisNoNetwork = await provider.diagnoseStars(intake);
    globalThis.fetch = realFetch;
    expect(diagnosisNoNetwork).toEqual(diagnosisAtTimeA);
  });
});
