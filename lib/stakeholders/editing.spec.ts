import { describe, expect, it } from "vitest";
import { addStakeholder, buildStakeholderMap, repositionStakeholder } from "./map";
import type { McpFetchResult } from "./mcp-client";

function emptyMap() {
  const mcpResult: McpFetchResult = { status: "ok", stakeholders: [] };
  return buildStakeholderMap(mcpResult);
}

describe("manual stakeholder management", () => {
  it("a user can add a net-new stakeholder with a manually chosen quadrant", () => {
    const map = emptyMap();

    // High influence, high support -> lands squarely in the "ally" quadrant, chosen manually
    // by the values the user supplies.
    const updated = addStakeholder(
      map,
      { name: "New Ally", influence: 9, support: 9 },
      () => "manual-1"
    );

    expect(updated.stakeholders).toHaveLength(1);
    const added = updated.stakeholders[0];
    expect(added.id).toBe("manual-1");
    expect(added.name).toBe("New Ally");
    expect(added.quadrant).toBe("ally");
    expect(added.source).toBe("manual");

    // Present on subsequent retrieval (the same map value carries it forward).
    expect(updated.stakeholders.find((s) => s.id === "manual-1")).toBeDefined();
  });

  it("a user can reassign an existing stakeholder to a different quadrant and the change persists", () => {
    const mcpResult: McpFetchResult = {
      status: "ok",
      stakeholders: [{ id: "p1", name: "Priya Nandakumar", influence: 9, support: 9 }],
    };
    const map = buildStakeholderMap(mcpResult);
    expect(map.stakeholders[0].quadrant).toBe("ally");

    const repositioned = repositionStakeholder(map, "p1", "monitor");

    const stakeholder = repositioned.stakeholders.find((s) => s.id === "p1")!;
    expect(stakeholder.quadrant).toBe("monitor");

    // Persists on subsequent retrieval of the same map value.
    const retrievedAgain = repositioned.stakeholders.find((s) => s.id === "p1")!;
    expect(retrievedAgain.quadrant).toBe("monitor");
  });
});
