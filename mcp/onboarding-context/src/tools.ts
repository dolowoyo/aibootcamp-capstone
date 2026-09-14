/**
 * Pure tool-handler logic, exercised directly by unit tests and wired into the MCP server's
 * registerTool() calls in server.ts. Shapes match docs/mcp-tool-contract.md exactly.
 *
 * Per that contract's "Division of responsibility": these tools expose raw signals only
 * (meetings, people, reporting structure) -- they never compute influence/support scores.
 * That derivation belongs to lib/stakeholders/mcp-client.ts (app side, PLAN-003).
 */

import type { Meeting, OrgFixture, Person, ReportingChainEntry } from "./types.js";

export interface ListMeetingsInput {
  weekOffset: number;
}

export interface ListMeetingsOutput {
  [key: string]: unknown;
  meetings: Meeting[];
}

export function listMeetings(fixture: OrgFixture, input: ListMeetingsInput): ListMeetingsOutput {
  const meetings = fixture.meetings
    .filter((meeting) => meeting.weekOffset === input.weekOffset)
    .map(({ id, personId, personName, date, durationMinutes }) => ({
      id,
      personId,
      personName,
      date,
      durationMinutes,
    }));
  return { meetings };
}

export interface SearchPeopleInput {
  query: string;
}

export interface SearchPeopleOutput {
  [key: string]: unknown;
  people: Person[];
}

/** Empty query returns everyone, per the contract. */
export function searchPeople(fixture: OrgFixture, input: SearchPeopleInput): SearchPeopleOutput {
  const query = input.query.trim().toLowerCase();
  if (query === "") {
    return { people: [...fixture.people] };
  }
  const people = fixture.people.filter(
    (person) =>
      person.name.toLowerCase().includes(query) ||
      person.title.toLowerCase().includes(query) ||
      person.department.toLowerCase().includes(query),
  );
  return { people };
}

export interface GetReportingChainInput {
  personId: string;
}

export interface GetReportingChainOutput {
  [key: string]: unknown;
  chain: ReportingChainEntry[];
}

/**
 * Ordered [personId's own record, their manager, their manager's manager, ...] up to the top.
 * An unknown personId, or a cycle in managerId links, resolves to the chain built so far
 * rather than throwing -- the server exposes raw signals and leaves interpretation to the
 * caller.
 */
export function getReportingChain(
  fixture: OrgFixture,
  input: GetReportingChainInput,
): GetReportingChainOutput {
  const byId = new Map(fixture.people.map((person) => [person.id, person]));
  const chain: ReportingChainEntry[] = [];
  const seen = new Set<string>();

  let current = byId.get(input.personId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push({ id: current.id, name: current.name, title: current.title });
    current = current.managerId ? byId.get(current.managerId) : undefined;
  }

  return { chain };
}
