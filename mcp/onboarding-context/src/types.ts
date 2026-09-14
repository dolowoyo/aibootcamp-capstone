/**
 * Shapes shared by the fixture store, tool handlers, and resource handlers. These mirror
 * docs/mcp-tool-contract.md exactly -- if either drifts, that doc is the one to update
 * (in the same commit) per its own "Reconciliation note".
 */

export type SentimentSignal = "supportive" | "neutral" | "resistant";

export interface Person {
  id: string;
  name: string;
  title: string;
  department: string;
  managerId: string | null;
  sentimentSignal: SentimentSignal;
}

/** A meeting record as stored in the fixture file -- includes `weekOffset` for filtering. */
export interface MeetingRecord {
  id: string;
  personId: string;
  personName: string;
  weekOffset: number;
  date: string;
  durationMinutes: number;
}

/** A meeting as returned by `list_meetings` / `calendar://week/{n}` -- no `weekOffset`. */
export interface Meeting {
  id: string;
  personId: string;
  personName: string;
  date: string;
  durationMinutes: number;
}

export interface OrgFixture {
  people: Person[];
  meetings: MeetingRecord[];
}

export interface ReportingChainEntry {
  id: string;
  name: string;
  title: string;
}
