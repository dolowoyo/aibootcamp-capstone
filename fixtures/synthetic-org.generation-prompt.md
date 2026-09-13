# Generation prompt — `fixtures/synthetic-org.json`

Per `docs/constitution.md` principle VII (fabricated data only) and the "Fixture data
requirement" in `docs/mcp-tool-contract.md`, this file records the prompt/spec used to
fabricate `fixtures/synthetic-org.json`. No client data, no Slalom-controlled data, no real
people or organizations were used or referenced.

## Prompt

> Generate a fabricated org chart and 13 weeks of calendar-meeting history for a synthetic
> company, to be used as fixture data behind an MCP server's `list_meetings`, `search_people`,
> and `get_reporting_chain` tools. Requirements:
>
> 1. **People (org directory).** ~12-15 fictional people forming a plausible multi-level
>    reporting hierarchy (C-suite → VP → Director → Manager → IC), spanning at least three
>    departments (e.g. Engineering, Product, Finance/Operations/People). Each person has:
>    `id` (stable slug), `name` (fabricated, no resemblance to real individuals), `title`,
>    `department`, `managerId` (null only for the top of the chart), and a `sentimentSignal`
>    of exactly one of `"supportive"`, `"neutral"`, `"resistant"` — distributed across all
>    three values, not clustered on one.
> 2. **Meetings (calendar history).** For `weekOffset` values `0` through `-12` (13 weeks,
>    present week back to ~90 days ago), generate meeting records with a *different* average
>    frequency per person — some people meet the new leader multiple times a week, some
>    monthly, some rarely — so that a downstream influence-scoring heuristic (recency ×
>    frequency) produces real spread across people rather than a flat distribution. At least
>    one person's frequency should visibly change partway through the 13-week window (e.g.
>    drops off in the most recent weeks), to fabricate a realistic "cooling relationship"
>    signal. Each meeting has `id`, `personId`, `personName`, `weekOffset`, `date` (ISO 8601,
>    consistent with its `weekOffset`), and `durationMinutes` (varied, 15-60).
> 3. Output as a single JSON object: `{ "people": [...], "meetings": [...] }`, matching the
>    field shapes in `docs/mcp-tool-contract.md` exactly (plus the internal `weekOffset` field
>    on meetings, used for filtering — the MCP server's `list_meetings` tool strips it before
>    returning results, per that contract's output shape).
> 4. Deterministic: the same generation process, given the same seed, produces the same
>    fixture every time it's regenerated — no wall-clock-dependent values.

## How it was actually produced

The dataset was authored directly against the prompt above (no live API call — this capstone
has no inference budget to spend on fixture authoring, see ADR-0001). A small deterministic
script (seeded PRNG, not committed — it's a one-off authoring aid, not part of the runtime or
test surface) assigned each person a `freqPerWeek` and, for one person (`p-005`, VP Product,
`resistant`), an `activeWeeks` cutoff at `weekOffset -6` to fabricate the "cooling
relationship" signal called for in requirement 2. It then emitted one meeting record per
person per week according to that frequency (with fractional frequencies resolved via the
seeded RNG so, e.g., a `0.5`/week person gets a meeting roughly every other week, not a
literal half-meeting), across a fixed 13-week span anchored at a static Monday
(`2026-09-07T00:00:00.000Z` — chosen as a stand-in "present," not derived from the actual
run date, so the fixture never changes on regeneration).

## Resulting distribution (sanity check against the "no flat quadrant" requirement)

Meeting counts across the 13-week window, by person (id → count):

```text
p-004 (VP Engineering)        26
p-006 (Director of Eng.)      26
p-008 (Engineering Manager)   13
p-009 (Engineering Manager)   13
p-014 (Principal Architect)   13
p-007 (Director of Product)    8
p-001 (CEO)                    5
p-005 (VP Product)             7   (all within weeks 0 to -6 only — dropped off before that)
p-013 (Head of People)         7
p-011 (Senior Engineer)        7
p-010 (Staff Engineer)         6
p-003 (COO)                    4
p-002 (CFO)                    3
p-012 (Product Manager)        2
```

Frequency spans a 13x range (2 to 26 meetings) across the fixture population, and
`sentimentSignal` is distributed across all three values (supportive: 6, neutral: 5,
resistant: 3) — enough variation that a downstream influence/support scoring heuristic
(`lib/stakeholders/mcp-client.ts`, owned by `PLAN-003`) lands people in more than one
quadrant.
