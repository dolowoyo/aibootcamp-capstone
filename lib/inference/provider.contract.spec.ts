import { describe, expect, it } from "vitest";
import type { InferenceProvider } from "./provider";
import { FixtureProvider } from "./adapters/fixture";
import { SidecarProvider } from "./adapters/sidecar";
import { AnthropicProvider, type AnthropicLikeClient } from "./adapters/anthropic";
import { starsDiagnosisSchema } from "./schemas/stars-diagnosis";
import { milestoneSchema } from "./schemas/plan";

const SAMPLE_INTAKE = { narrative: "a".repeat(60) };
const SAMPLE_DIAGNOSIS = { dominantType: "startup" };

const RAW_DIAGNOSIS = {
  dominantType: "startup",
  confidence: "high",
  rationale: "conformance check rationale referencing the intake",
  evidence: ["conformance evidence excerpt"],
};

const RAW_MILESTONES = [
  {
    id: "conformance-1",
    phase: "1-30",
    order: 0,
    text: "conformance milestone text",
    rationale: "conformance milestone rationale",
  },
];

/** One identical conformance check, run against every adapter (SPEC-000 AC-0.1). */
async function assertConformance(provider: InferenceProvider): Promise<void> {
  const diagnosis = await provider.diagnoseStars(SAMPLE_INTAKE);
  expect(starsDiagnosisSchema.safeParse(diagnosis).success).toBe(true);

  const milestones = await provider.generatePlan(SAMPLE_DIAGNOSIS);
  expect(Array.isArray(milestones)).toBe(true);
  for (const milestone of milestones) {
    expect(milestoneSchema.safeParse(milestone).success).toBe(true);
  }
}

describe("provider contract", () => {
  it("each adapter (fixture, sidecar, anthropic) implements diagnoseStars and generatePlan with schema-valid output", async () => {
    const fixtureProvider = new FixtureProvider();
    await assertConformance(fixtureProvider);

    // Wire shape per services/inference-sidecar/README.md (reconciled 2026-09-13):
    // POST /diagnose | /plan -> { prompt, schema } in, { result: <object> } out on 200.
    // /plan's result is { milestones: Milestone[] }, not a bare array -- the Anthropic API
    // requires a structured-output tool's input_schema to be object-typed at the top level, so
    // sidecar.ts wraps the array in an object on the way out and unwraps it on the way back
    // (found via a live Block 3 integration run, see sidecar.ts's milestoneListWireSchema doc).
    const sidecarProvider = new SidecarProvider({} as unknown as NodeJS.ProcessEnv, {
      fetchImpl: (async (url: string) => {
        if (url.endsWith("/diagnose")) {
          return new Response(JSON.stringify({ result: RAW_DIAGNOSIS }), { status: 200 });
        }
        return new Response(JSON.stringify({ result: { milestones: RAW_MILESTONES } }), {
          status: 200,
        });
      }) as unknown as typeof fetch,
    });
    await assertConformance(sidecarProvider);

    const mockAnthropicClient: AnthropicLikeClient = {
      diagnoseStars: async () => RAW_DIAGNOSIS,
      generatePlan: async () => RAW_MILESTONES,
    };
    const anthropicProvider = new AnthropicProvider(
      { ANTHROPIC_API_KEY: "test-key" } as unknown as NodeJS.ProcessEnv,
      mockAnthropicClient
    );
    await assertConformance(anthropicProvider);
  });
});
