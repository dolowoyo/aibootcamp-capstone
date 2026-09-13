# PLAN-003 — Stakeholder & coalition map

**Implements:** SPEC-003
**Written via:** `writing-plans` skill

## ACs covered

AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6, AC-3.7 — all ACs in SPEC-003.

## Technical approach

**Schema placement — a deliberate departure from `PLAN-000`'s convention.** SPEC-003's data
does not come from the LLM inference boundary (no `diagnoseStars`/`generatePlan` call is
involved) — it comes from the `mcp/onboarding-context` MCP server. Putting its validation
schema in `lib/inference/schemas/` alongside `StarsDiagnosis`/`Plan` would misrepresent what
seam it actually guards. This plan instead places it at `lib/stakeholders/schema.ts` — a
lightweight Zod schema validating the *shape* of a raw stakeholder record coming back from the
MCP client, co-located with the domain logic that consumes it. This is a judgment call
(the task description explicitly left it to architect's discretion) — flagged here rather than
silently decided, in case a future spec wants a single unified "external boundary" convention
across both inference and MCP data.

**Modules:**
- `lib/stakeholders/mcp-client.ts` — wraps `mcp/onboarding-context`'s `list_meetings`,
  `search_people`, and `get_reporting_chain` (per `docs/00-capstone-plan.md`'s documented tool
  set) to assemble a raw stakeholder list with an interaction-frequency signal per person.
  Returns a discriminated `McpFetchResult` —
  `{status:"ok", stakeholders}` | `{status:"unavailable"}` | `{status:"partial", stakeholders, skippedCount}`
  — rather than throwing on failure, so callers implement AC-3.6/AC-3.7 as data-driven
  branches, not exception handling.
- `lib/stakeholders/classify.ts` — pure `classifyQuadrant(influence, support)` with an
  explicit, stated tie-break rule (see Interfaces below) — this resolves SPEC-003's flagged
  open question about boundary values, as a plan-level algorithmic decision.
- `lib/stakeholders/map.ts` — `buildStakeholderMap()` merges MCP-sourced stakeholders with any
  manually added/repositioned ones, applying the AC-3.6/AC-3.7 degradation rules, and exposes
  `addStakeholder()`/`repositionStakeholder()` for AC-3.4/AC-3.5.

**Data source:** `fixtures/synthetic-org.json` (already planned in the repo layout) backs the
fixture-mode MCP client during tests and CI — the same fabricated org/calendar data the real
`mcp/onboarding-context` server will read from once built in Block 2. This plan's interfaces
are written against that server's *documented* tool signatures before the server itself
exists; see Risks.

## Interfaces / contracts

```ts
// lib/stakeholders/schema.ts
interface RawStakeholderRecord {
  id: string;
  name: string;
  influence?: number;   // 1-10; absent → incomplete record (AC-3.7)
  support?: number;      // 1-10; absent → incomplete record (AC-3.7)
}

// lib/stakeholders/mcp-client.ts
type McpFetchResult =
  | { status: "ok"; stakeholders: RawStakeholderRecord[] }
  | { status: "unavailable" }
  | { status: "partial"; stakeholders: RawStakeholderRecord[]; skippedCount: number };
function fetchStakeholders(): Promise<McpFetchResult>;

// lib/stakeholders/classify.ts
type Quadrant = "ally" | "opponent" | "keep-informed" | "monitor";
// Scale: 1-10 on each axis. Midpoint 5.5 on both. Ties at exactly the midpoint resolve toward
// the *lower* quadrant on that axis (support >= 5.5 -> "high support" side; support < 5.5,
// including exactly 5.5 rounded down by this rule -> "low support" side; same rule for
// influence). This is the explicit tie-break SPEC-003 flagged as needed for AC-3.1 to be
// decidable at every input value.
function classifyQuadrant(influence: number, support: number): Quadrant;

const QUADRANT_POSTURE: Record<Quadrant, string> = {
  ally: "leverage",
  opponent: "convert-or-neutralize",
  "keep-informed": "keep-informed",
  monitor: "monitor",
};

// lib/stakeholders/map.ts
interface Stakeholder extends RawStakeholderRecord {
  influence: number; support: number;  // required here — only complete records become Stakeholders
  quadrant: Quadrant;
  source: "mcp" | "manual";
}
interface StakeholderMap {
  stakeholders: Stakeholder[];
  dataStatus: "ok" | "unavailable" | "partial";
  skippedCount?: number;
}
function buildStakeholderMap(mcpResult: McpFetchResult, manual: Stakeholder[]): StakeholderMap;
function addStakeholder(map: StakeholderMap, s: Omit<Stakeholder, "id" | "source" | "quadrant">): StakeholderMap;
function repositionStakeholder(map: StakeholderMap, id: string, quadrant: Quadrant): StakeholderMap;
```

## Tradeoffs considered

- **Validating MCP responses with a local schema vs. trusting the MCP SDK's own typing.**
  Validate explicitly chosen — the MCP server doesn't exist yet (Block 2), so nothing
  guarantees its eventual output matches this plan's assumptions until it's built; a local
  schema also gives AC-3.7's "incomplete record" detection one single implementation point
  instead of scattered ad hoc field checks.
- **Server-side/domain-layer quadrant classification vs. computing it in the UI.**
  Domain-layer (`classify.ts`) chosen so AC-3.1's "exactly one quadrant" guarantee is enforced
  once, not reimplemented (and potentially drifted) across multiple UI surfaces.
- **Manual `addStakeholder`/`repositionStakeholder` as map-level operations vs. direct mutation
  of the stakeholder array.** Map-level functions chosen — same reasoning as SPEC-002's edit
  functions: a clear, testable seam that the persistence layer wraps, rather than ad hoc
  mutation scattered through UI code.

## Risks

- **The `mcp/onboarding-context` server doesn't exist yet.** This plan's `mcp-client.ts`
  interface is written against the tool names and shapes documented in
  `docs/00-capstone-plan.md` (`list_meetings`, `search_people`, `get_reporting_chain`), not
  against a real, tested server. Whoever builds that server in Block 2 and whoever builds
  `lib/stakeholders/mcp-client.ts` should reconcile the actual tool response shapes early —
  a mismatch here would surface as an integration failure late in Block 2/3 rather than a
  Block 1 finding, since it can't be caught by this spec's own tests (which run against
  fixture data standing in for the server).
- **Influence/support derivation is a heuristic, not a fact.** Turning "12 meetings in the
  last 90 days" into an influence score of, say, 7 is a scoring choice this plan makes at
  implementation time, not a guarantee this spec or plan can make binding — reasonable people
  could tune the formula differently. Flagging so it isn't mistaken for a settled question.
- **Tie-break rule visibility.** The 5.5-midpoint tie-break above is asymmetric by
  construction (documented, not hidden) — if fixture data is later generated with values that
  cluster near the midpoint, quadrant assignment could look arbitrary to a viewer even though
  it's deterministic. Worth choosing fixture values that land clearly inside a quadrant, not
  near the boundary, purely for demo legibility.
