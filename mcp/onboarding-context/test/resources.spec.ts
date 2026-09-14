import { describe, expect, it } from "vitest";
import { readOrgDirectory, readCalendarWeek } from "../src/resources.js";
import type { OrgFixture } from "../src/types.js";

const fixture: OrgFixture = {
  people: [
    { id: "p-1", name: "Ada Okoro", title: "CEO", department: "Executive", managerId: null, sentimentSignal: "neutral" },
    { id: "p-2", name: "Ben Fischer", title: "VP Engineering", department: "Engineering", managerId: "p-1", sentimentSignal: "supportive" },
  ],
  meetings: [
    { id: "m-1", personId: "p-2", personName: "Ben Fischer", weekOffset: 0, date: "2026-09-08T15:00:00.000Z", durationMinutes: 30 },
    { id: "m-2", personId: "p-2", personName: "Ben Fischer", weekOffset: -3, date: "2026-08-18T15:00:00.000Z", durationMinutes: 30 },
  ],
};

describe("org://directory resource", () => {
  it("returns the full org directory snapshot", () => {
    const result = readOrgDirectory(fixture);
    expect(result.people).toEqual(fixture.people);
  });
});

describe("calendar://week/{n} resource", () => {
  it("returns only the given week's meetings", () => {
    const result = readCalendarWeek(fixture, 0);
    expect(result.meetings).toEqual([fixture.meetings[0]]);
  });

  it("returns an empty list for a week with no meetings", () => {
    const result = readCalendarWeek(fixture, -7);
    expect(result.meetings).toEqual([]);
  });
});
