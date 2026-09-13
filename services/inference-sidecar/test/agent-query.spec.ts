import { describe, expect, it } from "vitest";
import { AgentQueryError, AgentTimeoutError, runStructuredQuery } from "../src/agent-query.js";
import type { QueryFn } from "../src/agent-query.js";

/**
 * These tests exercise runStructuredQuery() -- the wrapper around the Claude Agent SDK's
 * query() -- entirely against a fake `queryFn`, per docs/adr/0001-inference-boundary.md and
 * this task's own scope note (TASKS-000 Task 9): a real Agent SDK call needs the `claude` CLI
 * and keychain, neither of which exist in CI/containers, so it is not exercised live here.
 * Everything that IS mockable (message parsing, success/error/timeout handling) is covered.
 */

function fakeQuery(messages: unknown[]): QueryFn {
  return () => {
    async function* generator() {
      for (const message of messages) {
        yield message as never;
      }
    }
    return generator() as ReturnType<QueryFn>;
  };
}

function neverResolvingQuery(): QueryFn {
  return () => {
    async function* generator() {
      await new Promise(() => {
        // never resolves -- simulates a hung Agent SDK call for timeout testing
      });
      yield {} as never;
    }
    return generator() as ReturnType<QueryFn>;
  };
}

describe("runStructuredQuery", () => {
  it("resolves with the result message's structured_output on a successful turn", async () => {
    const queryFn = fakeQuery([
      { type: "assistant", message: { content: [] } },
      { type: "result", subtype: "success", is_error: false, structured_output: { situationType: "startup" } },
    ]);

    const result = await runStructuredQuery({
      prompt: "diagnose this intake",
      schema: { type: "object" },
      queryFn,
    });

    expect(result).toEqual({ situationType: "startup" });
  });

  it("rejects with AgentQueryError when the result message has no structured_output", async () => {
    const queryFn = fakeQuery([{ type: "result", subtype: "success", is_error: false }]);

    await expect(
      runStructuredQuery({ prompt: "p", schema: {}, queryFn }),
    ).rejects.toBeInstanceOf(AgentQueryError);
  });

  it("rejects with AgentQueryError when the turn ends in an error result", async () => {
    const queryFn = fakeQuery([
      { type: "result", subtype: "error_during_execution", is_error: true, errors: ["model overloaded"] },
    ]);

    await expect(
      runStructuredQuery({ prompt: "p", schema: {}, queryFn }),
    ).rejects.toThrow(/model overloaded/);
  });

  it("rejects with AgentQueryError when a success-subtype result carries is_error true", async () => {
    const queryFn = fakeQuery([
      { type: "result", subtype: "success", is_error: true, result: "API error mid-turn" },
    ]);

    await expect(
      runStructuredQuery({ prompt: "p", schema: {}, queryFn }),
    ).rejects.toThrow(/API error mid-turn/);
  });

  it("rejects with AgentQueryError when the message stream ends without any result message", async () => {
    const queryFn = fakeQuery([{ type: "assistant", message: { content: [] } }]);

    await expect(
      runStructuredQuery({ prompt: "p", schema: {}, queryFn }),
    ).rejects.toBeInstanceOf(AgentQueryError);
  });

  it("rejects with AgentTimeoutError when the query does not resolve within the timeout", async () => {
    const queryFn = neverResolvingQuery();

    await expect(
      runStructuredQuery({ prompt: "p", schema: {}, queryFn, timeoutMs: 25 }),
    ).rejects.toBeInstanceOf(AgentTimeoutError);
  });
});
