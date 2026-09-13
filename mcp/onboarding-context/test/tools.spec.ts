import { describe, expect, it } from "vitest";
import { getReportingChain, listMeetings, searchPeople } from "../src/tools.js";
import { loadOrgFixture } from "../src/fixture-store.js";
import type { OrgFixture } from "../src/types.js";

// A small, hand-built fixture for isolated unit tests -- independent of the real (larger)
// fixtures/synthetic-org.json, which is exercised separately below as an integration check.
const fixture: OrgFixture = {
  people: [
    { id: "p-1", name: "Ada Okoro", title: "CEO", department: "Executive", managerId: null, sentimentSignal: "neutral" },
    { id: "p-2", name: "Ben Fischer", title: "VP Engineering", department: "Engineering", managerId: "p-1", sentimentSignal: "supportive" },
    { id: "p-3", name: "Chidinma Eze", title: "Engineering Manager", department: "Engineering", managerId: "p-2", sentimentSignal: "resistant" },
  ],
  meetings: [
    { id: "m-1", personId: "p-2", personName: "Ben Fischer", weekOffset: 0, date: "2026-09-08T15:00:00.000Z", durationMinutes: 30 },
    { id: "m-2", personId: "p-3", personName: "Chidinma Eze", weekOffset: 0, date: "2026-09-09T16:00:00.000Z", durationMinutes: 45 },
    { id: "m-3", personId: "p-2", personName: "Ben Fischer", weekOffset: -1, date: "2026-09-01T15:00:00.000Z", durationMinutes: 30 },
  ],
};

describe("list_meetings tool handler", () => {
  it("returns only meetings for the given weekOffset, without the internal weekOffset field", () => {
    const result = listMeetings(fixture, { weekOffset: 0 });
    expect(result.meetings).toHaveLength(2);
    expect(result.meetings).toEqual(
      expect.arrayContaining([
        { id: "m-1", personId: "p-2", personName: "Ben Fischer", date: "2026-09-08T15:00:00.000Z", durationMinutes: 30 },
        { id: "m-2", personId: "p-3", personName: "Chidinma Eze", date: "2026-09-09T16:00:00.000Z", durationMinutes: 45 },
      ]),
    );
    for (const meeting of result.meetings) {
      expect(meeting).not.toHaveProperty("weekOffset");
    }
  });

  it("returns an empty array for a weekOffset with no meetings", () => {
    const result = listMeetings(fixture, { weekOffset: -12 });
    expect(result.meetings).toEqual([]);
  });
});

describe("search_people tool handler", () => {
  it("returns everyone when the query is empty", () => {
    const result = searchPeople(fixture, { query: "" });
    expect(result.people).toHaveLength(3);
  });

  it("filters by name, title, or department, case-insensitively", () => {
    const byName = searchPeople(fixture, { query: "ben" });
    expect(byName.people.map((p) => p.id)).toEqual(["p-2"]);

    const byTitle = searchPeople(fixture, { query: "engineering manager" });
    expect(byTitle.people.map((p) => p.id)).toEqual(["p-3"]);

    const byDepartment = searchPeople(fixture, { query: "engineering" });
    expect(byDepartment.people.map((p) => p.id).sort()).toEqual(["p-2", "p-3"]);
  });

  it("includes sentimentSignal on every returned person", () => {
    const result = searchPeople(fixture, { query: "" });
    for (const person of result.people) {
      expect(["supportive", "neutral", "resistant"]).toContain(person.sentimentSignal);
    }
  });
});

describe("get_reporting_chain tool handler", () => {
  it("returns the chain ordered from the person up to the top of the org", () => {
    const result = getReportingChain(fixture, { personId: "p-3" });
    expect(result.chain).toEqual([
      { id: "p-3", name: "Chidinma Eze", title: "Engineering Manager" },
      { id: "p-2", name: "Ben Fischer", title: "VP Engineering" },
      { id: "p-1", name: "Ada Okoro", title: "CEO" },
    ]);
  });

  it("returns a single-entry chain for the top of the org", () => {
    const result = getReportingChain(fixture, { personId: "p-1" });
    expect(result.chain).toEqual([{ id: "p-1", name: "Ada Okoro", title: "CEO" }]);
  });

  it("returns an empty chain for an unknown personId", () => {
    const result = getReportingChain(fixture, { personId: "does-not-exist" });
    expect(result.chain).toEqual([]);
  });
});

describe("fixture loader", () => {
  it("loads the real fixtures/synthetic-org.json with the shape the contract requires", () => {
    const real = loadOrgFixture();
    expect(real.people.length).toBeGreaterThan(0);
    expect(real.meetings.length).toBeGreaterThan(0);

    for (const person of real.people) {
      expect(["supportive", "neutral", "resistant"]).toContain(person.sentimentSignal);
    }

    const weekOffsets = new Set(real.meetings.map((m) => m.weekOffset));
    for (let offset = 0; offset >= -12; offset--) {
      expect(weekOffsets.has(offset)).toBe(true);
    }
  });

  it("produces non-trivial interaction-frequency variation across the fixture population", () => {
    const real = loadOrgFixture();
    const counts = new Map<string, number>();
    for (const m of real.meetings) {
      counts.set(m.personId, (counts.get(m.personId) ?? 0) + 1);
    }
    const values = [...counts.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(5);
  });
});
