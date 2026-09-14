import { describe, expect, it } from "vitest";
import { buildStakeholderMap } from "./map";
import type { McpFetchResult } from "./mcp-client";

describe("map population", () => {
  it("the map is pre-populated from MCP-sourced data without manual entry when the source is fully available", () => {
    const mcpResult: McpFetchResult = {
      status: "ok",
      stakeholders: [
        { id: "p1", name: "Priya Nandakumar", influence: 9, support: 8 },
        { id: "p2", name: "Marcus Webb", influence: 3, support: 2 },
      ],
    };

    const map = buildStakeholderMap(mcpResult);

    expect(map.dataStatus).toBe("ok");
    expect(map.stakeholders).toHaveLength(2);
    expect(map.stakeholders.every((s) => s.source === "mcp")).toBe(true);
    const priya = map.stakeholders.find((s) => s.id === "p1")!;
    expect(priya.influence).toBe(9);
    expect(priya.support).toBe(8);
    expect(priya.quadrant).toBe("ally");
  });
});

describe("graceful degradation", () => {
  it("the map renders an empty state with a visible notice when the MCP source is entirely unavailable", () => {
    const mcpResult: McpFetchResult = { status: "unavailable" };

    const map = buildStakeholderMap(mcpResult);

    expect(map.dataStatus).toBe("unavailable");
    expect(map.stakeholders).toEqual([]);
  });

  it("incomplete MCP records are excluded and reported rather than defaulted into a guessed quadrant", () => {
    const mcpResult: McpFetchResult = {
      status: "partial",
      stakeholders: [
        { id: "p1", name: "Priya Nandakumar", influence: 9, support: 8 },
        // p2 and p3 were excluded upstream (missing influence/support) — the
        // `mcp-client.ts` fetch layer never forwards them as complete records.
      ],
      skippedCount: 2,
    };

    const map = buildStakeholderMap(mcpResult);

    expect(map.dataStatus).toBe("partial");
    expect(map.skippedCount).toBe(2);
    expect(map.stakeholders).toHaveLength(1);
    expect(map.stakeholders[0].id).toBe("p1");
  });
});
