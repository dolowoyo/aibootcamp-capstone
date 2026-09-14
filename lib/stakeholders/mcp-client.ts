import { rawStakeholderRecordSchema, type RawStakeholderRecord } from "./schema";

/**
 * Raw signal shapes, matching `docs/mcp-tool-contract.md` exactly (the authoritative
 * interface both sides of Block 2's parallel build implement against). This module never
 * imports or depends on `fixtures/synthetic-org.json` — that fixture is owned by whoever
 * builds `mcp/onboarding-context` in a different worktree. Tests inject an in-memory
 * `McpToolClient` built from small, local, inline mock data shaped to this same contract
 * (see `lib/stakeholders/mcp-client.spec.ts`).
 */
export interface Meeting {
  id: string;
  personId: string;
  personName: string;
  date: string;
  durationMinutes: number;
}

export interface Person {
  id: string;
  name: string;
  title: string;
  department: string;
  managerId: string | null;
  sentimentSignal: "supportive" | "neutral" | "resistant";
}

export interface ReportingChainEntry {
  id: string;
  name: string;
  title: string;
}

export interface McpToolClient {
  listMeetings(input: { weekOffset: number }): Promise<{ meetings: Meeting[] }>;
  searchPeople(input: { query: string }): Promise<{ people: Person[] }>;
  getReportingChain(input: { personId: string }): Promise<{ chain: ReportingChainEntry[] }>;
}

export type McpFetchResult =
  | { status: "ok"; stakeholders: RawStakeholderRecord[] }
  | { status: "unavailable" }
  | { status: "partial"; stakeholders: RawStakeholderRecord[]; skippedCount: number };

/** `docs/mcp-tool-contract.md`'s derivation contract: sentiment -> support (1-10). */
const SENTIMENT_TO_SUPPORT: Record<Person["sentimentSignal"], number> = {
  supportive: 8,
  neutral: 5,
  resistant: 2,
};

/** `weekOffset` 0 through -12 -> ~13 weeks of meeting history, per the tool contract. */
const WEEKS_OF_HISTORY = 13;

/**
 * Derives an influence score (1-10) from meeting frequency over the last ~13 weeks and
 * proximity in the person's reporting chain (a scoring choice this module owns at
 * implementation time, per PLAN-003 — not a guarantee the MCP server's contract makes
 * binding).
 */
function deriveInfluence(meetingCount: number, chainLength: number): number {
  const meetingComponent = Math.min(7, meetingCount);
  const proximityComponent = chainLength <= 1 ? 3 : chainLength === 2 ? 2 : 1;
  return Math.max(1, Math.min(10, meetingComponent + proximityComponent));
}

/**
 * Assembles a raw stakeholder list from `list_meetings`/`search_people`/
 * `get_reporting_chain`. Never throws — any failure (connection failure, or the source
 * returning nothing) resolves to `{status: "unavailable"}` (AC-3.6); a person record this
 * module cannot derive a complete influence/support pair for is excluded and counted, never
 * defaulted into a guessed quadrant (AC-3.7).
 */
export async function fetchStakeholders(client: McpToolClient): Promise<McpFetchResult> {
  try {
    const { people } = await client.searchPeople({ query: "" });

    const meetingCounts = new Map<string, number>();
    for (let weekOffset = 0; weekOffset >= -(WEEKS_OF_HISTORY - 1); weekOffset -= 1) {
      const { meetings } = await client.listMeetings({ weekOffset });
      for (const meeting of meetings) {
        meetingCounts.set(meeting.personId, (meetingCounts.get(meeting.personId) ?? 0) + 1);
      }
    }

    const stakeholders: RawStakeholderRecord[] = [];
    let skippedCount = 0;

    for (const person of people) {
      try {
        const support = SENTIMENT_TO_SUPPORT[person.sentimentSignal];
        if (support === undefined) {
          throw new Error(`missing or unrecognized sentimentSignal for ${person.id}`);
        }
        const { chain } = await client.getReportingChain({ personId: person.id });
        const meetingCount = meetingCounts.get(person.id) ?? 0;
        const candidate = {
          id: person.id,
          name: person.name,
          influence: deriveInfluence(meetingCount, chain.length),
          support,
        };
        const parsed = rawStakeholderRecordSchema.safeParse(candidate);
        if (parsed.success) {
          stakeholders.push(parsed.data);
        } else {
          skippedCount += 1;
        }
      } catch {
        skippedCount += 1;
      }
    }

    if (skippedCount > 0) {
      return { status: "partial", stakeholders, skippedCount };
    }
    return { status: "ok", stakeholders };
  } catch {
    return { status: "unavailable" };
  }
}
