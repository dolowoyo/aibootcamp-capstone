/**
 * Pure resource-read logic behind the two read-only MCP resources
 * (org://directory, calendar://week/{n}) described in docs/mcp-tool-contract.md. Dev-time
 * agent context only -- not consumed by lib/stakeholders/mcp-client.ts (that goes through the
 * tools above).
 */

import type { MeetingRecord, OrgFixture, Person } from "./types.js";

export interface OrgDirectorySnapshot {
  people: Person[];
}

export function readOrgDirectory(fixture: OrgFixture): OrgDirectorySnapshot {
  return { people: [...fixture.people] };
}

export interface CalendarWeekSnapshot {
  meetings: MeetingRecord[];
}

/**
 * Unlike the list_meetings tool, this resource is dev-time agent context only (not consumed
 * by mcp-client.ts per the contract doc), so it returns the raw fixture record verbatim,
 * `weekOffset` included -- useful context for an agent inspecting the data, and there's no
 * external shape contract to strip it for.
 */
export function readCalendarWeek(fixture: OrgFixture, weekOffset: number): CalendarWeekSnapshot {
  const meetings = fixture.meetings.filter((meeting) => meeting.weekOffset === weekOffset);
  return { meetings };
}
