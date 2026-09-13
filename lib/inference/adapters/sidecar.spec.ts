import { describe, expect, it } from "vitest";
import { SidecarProvider } from "./sidecar";
import { ProviderUnavailableError } from "../errors";

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
