import { describe, expect, it } from "vitest";
import { SidecarProvider } from "./sidecar";
import { ProviderUnavailableError } from "../errors";

// A live end-to-end run (Block 3 integration) surfaced two real bugs that no mocked-boundary
// test caught, both rooted in the same fact: the Agent SDK's outputFormat: {type:
// 'json_schema'} is implemented as an end-turn tool call, and the Anthropic API requires a
// tool's input_schema to be an object schema at the top level (tool calls always carry a JSON
// object of named arguments -- see @anthropic-ai/claude-agent-sdk's sdk.d.ts JsonSchemaOutputFormat
// doc comment). Two schemas violated this:
// 1. zodToJsonSchema(schema, "SomeName") wraps its output in a top-level { $ref, definitions }
//    shape with no top-level "type" -- rejected with "input_schema.type: Field required".
// 2. generatePlan's domain schema is an array (Milestone[]) -- rejected with
//    "input_schema.type: Input should be 'object'".
// Both surfaced as a 400 from the Anthropic API that the sidecar process reports as a 502.
// This test pins the request body shape so a regression fails loudly instead of only failing
// on a live call.
describe("sidecar adapter request schema shape", () => {
  it("sends an object-typed JSON Schema with no $ref/definitions wrapper", async () => {
    const requestBodies: unknown[] = [];
    const provider = new SidecarProvider({} as unknown as NodeJS.ProcessEnv, {
      fetchImpl: (async (_url: string, init?: RequestInit) => {
        requestBodies.push(JSON.parse(init?.body as string));
        return new Response(JSON.stringify({ result: { milestones: [] } }), { status: 200 });
      }) as unknown as typeof fetch,
    });

    await provider.diagnoseStars({ narrative: "irrelevant" }).catch(() => undefined);
    await provider.generatePlan({}).catch(() => undefined);

    expect(requestBodies).toHaveLength(2);
    for (const body of requestBodies) {
      const schema = (body as { schema: Record<string, unknown> }).schema;
      expect(schema).not.toHaveProperty("$ref");
      expect(schema).not.toHaveProperty("definitions");
      expect(schema.type).toBe("object");
    }
  });
});

// Failure shapes per services/inference-sidecar/README.md (reconciled 2026-09-13): 502
// (agent_error), 504 (timeout), and connection-refused/network-error all collapse to
// ProviderUnavailableError alike (see sidecar.ts's doc comment for the full contract).
describe("sidecar adapter failure handling", () => {
  it("a connection failure or non-2xx response rejects with ProviderUnavailableError", async () => {
    const connectionRefused = new SidecarProvider({} as unknown as NodeJS.ProcessEnv, {
      fetchImpl: (async () => {
        throw new Error("connect ECONNREFUSED");
      }) as unknown as typeof fetch,
    });
    await expect(connectionRefused.diagnoseStars({ narrative: "irrelevant" })).rejects.toBeInstanceOf(
      ProviderUnavailableError
    );

    const agentError = new SidecarProvider({} as unknown as NodeJS.ProcessEnv, {
      fetchImpl: (async () =>
        new Response(JSON.stringify({ error: "agent_error", message: "turn errored" }), {
          status: 502,
        })) as unknown as typeof fetch,
    });
    await expect(agentError.diagnoseStars({ narrative: "irrelevant" })).rejects.toBeInstanceOf(
      ProviderUnavailableError
    );

    const timeoutStatus = new SidecarProvider({} as unknown as NodeJS.ProcessEnv, {
      fetchImpl: (async () =>
        new Response(JSON.stringify({ error: "timeout", message: "no result within 30s" }), {
          status: 504,
        })) as unknown as typeof fetch,
    });
    await expect(timeoutStatus.diagnoseStars({ narrative: "irrelevant" })).rejects.toBeInstanceOf(
      ProviderUnavailableError
    );

    const abortsBeforeResponding = new SidecarProvider(
      {} as unknown as NodeJS.ProcessEnv,
      {
        fetchImpl: (async (_url: string, init?: RequestInit) => {
          return new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          });
        }) as unknown as typeof fetch,
        timeoutMs: 5,
      }
    );
    await expect(abortsBeforeResponding.diagnoseStars({ narrative: "irrelevant" })).rejects.toBeInstanceOf(
      ProviderUnavailableError
    );
  });
});
