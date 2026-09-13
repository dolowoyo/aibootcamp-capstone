import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createServer } from "../src/server.js";
import type { QueryFn } from "../src/agent-query.js";

/**
 * HTTP-layer tests for the sidecar, per this task's scope note (TASKS-000 Task 9): the
 * Agent SDK call itself is mocked out via an injected queryFn (see agent-query.spec.ts for
 * that layer's own coverage) -- what's verified here is request/response shape, status-code
 * mapping, and timeout enforcement at the HTTP boundary.
 */

let server: Server;
let baseUrl: string;

function fakeQueryFn(messages: unknown[]): QueryFn {
  return () => {
    async function* generator() {
      for (const message of messages) yield message as never;
    }
    return generator() as ReturnType<QueryFn>;
  };
}

function start(queryFn: QueryFn, timeoutMs?: number) {
  server = createServer({ queryFn, timeoutMs });
  return new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

afterEach(() => {
  server?.close();
});

describe("POST /diagnose", () => {
  beforeEach(async () => {
    await start(
      fakeQueryFn([
        { type: "result", subtype: "success", is_error: false, structured_output: { situationType: "turnaround" } },
      ]),
    );
  });

  it("returns 200 with the structured result for a well-formed request", async () => {
    const res = await fetch(`${baseUrl}/diagnose`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "diagnose", schema: { type: "object" } }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ result: { situationType: "turnaround" } });
  });

  it("returns 400 when prompt or schema is missing from the request body", async () => {
    const res = await fetch(`${baseUrl}/diagnose`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "diagnose only" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});

describe("POST /plan", () => {
  beforeEach(async () => {
    await start(
      fakeQueryFn([{ type: "result", subtype: "success", is_error: false, structured_output: [{ day: 1 }] }]),
    );
  });

  it("returns 200 with the structured result for a well-formed request", async () => {
    const res = await fetch(`${baseUrl}/plan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "generate a plan", schema: { type: "array" } }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ result: [{ day: 1 }] });
  });
});

describe("error mapping", () => {
  it("returns 502 when the agent query ends in an error result", async () => {
    await start(
      fakeQueryFn([{ type: "result", subtype: "error_during_execution", is_error: true, errors: ["boom"] }]),
    );

    const res = await fetch(`${baseUrl}/diagnose`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "p", schema: {} }),
    });

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("agent_error");
  });

  it("returns 504 when the agent query exceeds the configured timeout", async () => {
    const hangingQueryFn: QueryFn = () => {
      async function* generator() {
        await new Promise(() => {
          // never resolves
        });
        yield {} as never;
      }
      return generator() as ReturnType<QueryFn>;
    };
    await start(hangingQueryFn, 25);

    const res = await fetch(`${baseUrl}/diagnose`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "p", schema: {} }),
    });

    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.error).toBe("timeout");
  });
});

describe("unknown routes", () => {
  it("returns 404 for a path other than /diagnose or /plan", async () => {
    await start(fakeQueryFn([]));

    const res = await fetch(`${baseUrl}/not-a-route`, { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for a GET request to /diagnose", async () => {
    await start(fakeQueryFn([]));

    const res = await fetch(`${baseUrl}/diagnose`, { method: "GET" });
    expect(res.status).toBe(404);
  });
});
