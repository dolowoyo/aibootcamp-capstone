# MCP tool contract — `mcp/onboarding-context`

**Status:** authoritative. This is not a spec (no ACs, not enforced by
`check-traceability.ts`) — it's the shared interface both sides of Block 2's parallel build
implement against, so neither builder guesses independently. If either side needs a change,
change it here first, in its own commit, and flag the other side.

**Why this exists:** `PLAN-003` (`lib/stakeholders/mcp-client.ts`) was written against tool
names and shapes described only in prose (`docs/00-capstone-plan.md`), not a real server. That
plan's own Risks section flagged this as exactly the kind of thing that surfaces as a late
integration failure if left implicit. This file resolves it before either builder starts.

All data behind these tools is fabricated (`fixtures/synthetic-org.json`) per the constitution's
data policy (principle VII) — no real people, org, or calendar data.

## Division of responsibility

The server exposes **raw signals only** — meetings, people, reporting structure. It does
**not** compute influence/support scores. `lib/stakeholders/mcp-client.ts` (app side) owns
that derivation, per `PLAN-003`'s explicit design ("a scoring choice this plan makes at
implementation time, not a guarantee this spec or plan can make binding"). This keeps the
server a dumb, testable data source and the scoring heuristic in one place, not duplicated.

## Tools

### `list_meetings`

Meetings in a given week, used to derive an interaction-frequency signal (a component of
influence).

**Input:**
```ts
{ weekOffset: number } // 0 = current week, negative = past weeks (e.g. -12 = ~90 days ago)
```

**Output:**
```ts
{
  meetings: Array<{
    id: string;
    personId: string;
    personName: string;
    date: string;          // ISO 8601
    durationMinutes: number;
  }>;
}
```

### `search_people`

The org directory. Empty query returns everyone.

**Input:**
```ts
{ query: string }
```

**Output:**
```ts
{
  people: Array<{
    id: string;
    name: string;
    title: string;
    department: string;
    managerId: string | null;
    sentimentSignal: "supportive" | "neutral" | "resistant"; // fabricated, drives support score
  }>;
}
```

### `get_reporting_chain`

A person's management chain, used as a component of influence (proximity to the leader's own
chain of command).

**Input:**
```ts
{ personId: string }
```

**Output:**
```ts
{
  chain: Array<{ id: string; name: string; title: string }>;
  // ordered [personId's own record, their manager, their manager's manager, ...] up to the top
}
```

## Resources (read-only, for dev-time agent context — not consumed by `mcp-client.ts`)

- `org://directory` — full org directory snapshot
- `calendar://week/{n}` — a given week's meetings

## Derivation contract (informational — binds `mcp-client.ts`, not the server)

So both sides know what the raw signals are *for*, even though the server doesn't compute
scores itself:

- **Influence (1-10):** a function of meeting frequency over the last ~13 weeks
  (`list_meetings` with `weekOffset` from `0` to `-12`) and proximity in
  `get_reporting_chain` (direct reports and direct manager score higher baseline than distant
  chain members). Exact formula is `mcp-client.ts`'s implementation detail.
- **Support (1-10):** derived from `sentimentSignal` — a reasonable starting map is
  `supportive → 8`, `neutral → 5`, `resistant → 2`, refinable at implementation time without
  changing this contract.

## Fixture data requirement

`fixtures/synthetic-org.json` (built by whoever implements the MCP server) must include
`sentimentSignal` per person and enough `list_meetings` history across at least 13 weeks of
`weekOffset` values to produce non-trivial influence variation — otherwise every fixture
stakeholder lands in the same quadrant, which defeats the point of the demo.

## Reconciliation note

If implementing the server reveals this contract needs to change (a field is awkward, a
derivation needs different raw data), **update this file in the same PR**, and call it out
explicitly in that PR's description — don't let `lib/stakeholders/mcp-client.ts` and
`mcp/onboarding-context`'s actual behavior silently drift apart.
