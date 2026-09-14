import { describe, expect, it } from "vitest";
import { fetchStakeholders, type McpToolClient, type Person } from "./mcp-client";

/**
 * Small, local, inline mock data matching `docs/mcp-tool-contract.md`'s documented shapes —
 * deliberately not `fixtures/synthetic-org.json` (owned by a different worktree building the
 * real MCP server). See TASKS-003's builder instructions for why.
 */
const PEOPLE: Person[] = [
  {
    id: "p1",
    name: "Priya Nandakumar",
    title: "VP Engineering",
    department: "Engineering",
    managerId: null,
    sentimentSignal: "supportive",
  },
  {
    id: "p2",
    name: "Marcus Webb",
    title: "Staff Engineer",
    department: "Engineering",
    managerId: "p1",
    sentimentSignal: "resistant",
  },
];

function makeMockClient(overrides: Partial<McpToolClient> = {}): McpToolClient {
  return {
    async listMeetings({ weekOffset }) {
      if (weekOffset === 0) {
        return {
          meetings: [
            { id: "m1", personId: "p1", personName: "Priya Nandakumar", date: "2026-09-08", durationMinutes: 30 },
            { id: "m2", personId: "p1", personName: "Priya Nandakumar", date: "2026-09-09", durationMinutes: 30 },
          ],
        };
      }
      return { meetings: [] };
    },
    async searchPeople() {
      return { people: PEOPLE };
    },
    async getReportingChain({ personId }) {
      if (personId === "p1") return { chain: [{ id: "p1", name: "Priya Nandakumar", title: "VP Engineering" }] };
      return {
        chain: [
          { id: "p2", name: "Marcus Webb", title: "Staff Engineer" },
          { id: "p1", name: "Priya Nandakumar", title: "VP Engineering" },
        ],
      };
    },
    ...overrides,
  };
}

describe("fetchStakeholders", () => {
  it("derives influence and support from meeting frequency, reporting chain, and sentiment", async () => {
    const result = await fetchStakeholders(makeMockClient());
    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("unreachable");

    const priya = result.stakeholders.find((s) => s.id === "p1")!;
    expect(priya.support).toBe(8); // supportive
    expect(priya.influence).toBeGreaterThan(0);

    const marcus = result.stakeholders.find((s) => s.id === "p2")!;
    expect(marcus.support).toBe(2); // resistant
  });

  it("resolves to unavailable when the underlying client throws", async () => {
    const client = makeMockClient({
      async searchPeople() {
        throw new Error("connection refused");
      },
    });
    const result = await fetchStakeholders(client);
    expect(result.status).toBe("unavailable");
  });

  it("excludes a person with no recognizable sentiment signal and reports it as skipped", async () => {
    const client = makeMockClient({
      async searchPeople() {
        return {
          people: [
            ...PEOPLE,
            {
              id: "p3",
              name: "Unknown Sentiment",
              title: "Analyst",
              department: "Ops",
              managerId: "p1",
              sentimentSignal: undefined as unknown as Person["sentimentSignal"],
            },
          ],
        };
      },
    });
    const result = await fetchStakeholders(client);
    expect(result.status).toBe("partial");
    if (result.status !== "partial") throw new Error("unreachable");
    expect(result.skippedCount).toBe(1);
    expect(result.stakeholders.some((s) => s.id === "p3")).toBe(false);
    expect(result.stakeholders.some((s) => s.id === "p1")).toBe(true);
  });
});
