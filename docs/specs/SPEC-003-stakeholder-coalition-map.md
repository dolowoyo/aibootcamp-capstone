# SPEC-003 — Stakeholder & coalition map

**Status:** implemented
**Owner:** architect
**Depends on:** None from SPEC-000/SPEC-001/SPEC-002 — this spec's data source is the planned
`mcp/onboarding-context` MCP server (org/calendar fixture data), not the LLM inference
provider. It has no dependency on a STARS diagnosis or a generated plan.

## Context & problem

Watkins' coalition-mapping guidance is explicit that a new leader should map who they
*actually* meet with and depend on, not who sits above them on the org chart — hierarchy and
real influence frequently diverge, and a leader who only maps the org chart misreads their own
risk. This spec covers building that map: plotting people on an influence × support grid,
populated from real interaction data rather than typed in from scratch, with a clear
recommended posture per quadrant, and the ability to correct the map by hand as the leader's
own read of people evolves.

This spec is scoped to the map itself — classification and display only. Turning the map into
a per-person action plan (specific tactics to convert an opponent or re-engage someone
drifting toward "monitor") is a deliberate, already-decided exclusion, tracked separately as
backlog issue #23 (Coalition Action Planner). Nothing in this spec should be read as
reopening that boundary.

## User outcomes

- A new leader can see the people relevant to their success plotted on an influence × support
  grid, so they can immediately tell an ally from an opponent from someone who just needs to
  be kept informed, without doing that analysis themselves from scratch.
- A new leader's map starts populated from their real interaction and org data rather than a
  blank form, so it reflects who they actually engage with instead of an assumed hierarchy.
- A new leader can see a distinct recommended posture for each quadrant, so the map orients
  them toward what the classification implies, not just where each person sits.
- A new leader can add a person the automatic population missed, or move someone to a
  different quadrant as their read of that person changes, so the map stays accurate as the
  first 90 days unfold.
- A new leader whose interaction data is partly or entirely unavailable still gets a usable
  map — populated with whatever is available, or empty and ready for manual entry — rather
  than a broken page.

## Acceptance criteria

- **AC-3.1** — Given stakeholder data (influence and support values), every stakeholder on
  the map renders into exactly one of four quadrants: ally, opponent, keep-informed, or
  monitor.
- **AC-3.2** — Each of the four quadrants displays a distinct, quadrant-specific recommended
  posture (leverage, convert-or-neutralize, keep-informed, monitor), and every stakeholder in
  a given quadrant displays that quadrant's posture.
- **AC-3.3** — When the source MCP data is fully available, the map's initial stakeholder set
  and each stakeholder's influence/support values are populated from that source data, without
  requiring the user to manually enter any stakeholder first.
- **AC-3.4** — A user can add a net-new stakeholder with a manually chosen quadrant, and that
  stakeholder is present on subsequent retrieval of the map.
- **AC-3.5** — A user can reassign an existing stakeholder to a different quadrant, and that
  reassignment is what is returned on subsequent retrieval of the map.
- **AC-3.6** — When the MCP data source is entirely unavailable (connection failure or no
  data returned), the map still renders — as an empty stakeholder set with a visible notice
  that automatic population failed — rather than failing to load or blocking the page, and a
  user can still add stakeholders manually per AC-3.4.
- **AC-3.7** — When the MCP data source returns some stakeholder records missing a required
  field (influence or support value), those specific records are excluded from the
  auto-populated map rather than defaulted into a guessed quadrant, a visible notice states
  how many records were skipped, and all other, complete records still render normally.

## Out of scope

- Per-stakeholder action planning or influence tactics — tracked as backlog issue #23
  (Coalition Action Planner). This spec stops at classification and display, by deliberate,
  already-confirmed decision (see `docs/decision-log.md`, 2026-09-13 entry "Backlog depth and
  SPEC-003 scope, confirmed with Dele").
- Real-time or ongoing sync with live calendar/org changes after the map's initial population
  — the map is populated once from available data at load time and thereafter maintained via
  the manual add/reposition operations in AC-3.4/AC-3.5, not by continuous re-fetching.
- Multi-user or shared maps — this spec covers a single leader's own map.
- Historical versioning of the map over time.
- The `mcp/onboarding-context` server's own implementation, tool contracts, and internal
  fixture data — that is its own future spec/plan deliverable. This spec only describes what
  it needs from that server as a data source (see Open questions).
- The exact numeric scale or UI mechanics for influence/support values (sliders, drag-and-drop
  positioning, etc.) — implementation detail for the plan, not this spec.

## Open questions

- **What the `mcp/onboarding-context` server needs to expose.** This spec assumes the server
  (or fixture data standing in for it before it's built) can supply, per stakeholder, at
  minimum: an identity (name), a signal derivable into an influence value (e.g. reporting
  relationship, meeting frequency), and a signal derivable into a support value (e.g.
  sentiment or engagement signal available in the fixture data). The exact derivation
  algorithm (how a meeting count becomes an influence score) is a plan-level decision, not
  specified here.
- **Quadrant boundary/tie-breaking rule.** Left as a `PLAN-003` algorithmic detail by design
  (confirmed 2026-09-13) — `PLAN-003`'s midpoint/ties-resolve-low rule is accepted as the
  concrete resolution.
- ~~Definition of "incomplete record" (AC-3.7).~~ **Confirmed 2026-09-13:** scoped to a
  missing influence or support value specifically, since those are the two fields AC-3.1's
  classification requires. A missing name or other field is out of this scope.

## Traceability

| AC | Behaviour | Test |
|----|-----------|------|
| AC-3.1 | Every stakeholder renders into exactly one of four influence x support quadrants | lib/stakeholders/quadrant-classification.spec.ts > quadrant classification > every stakeholder renders into exactly one of the four influence x support quadrants |
| AC-3.2 | Each quadrant displays a distinct recommended posture, inherited by its stakeholders | lib/stakeholders/quadrant-classification.spec.ts > quadrant posture > each quadrant displays a distinct recommended posture inherited by its stakeholders |
| AC-3.3 | The map is pre-populated from MCP-sourced data when that data is fully available | lib/stakeholders/mcp-population.spec.ts > map population > the map is pre-populated from MCP-sourced data without manual entry when the source is fully available |
| AC-3.4 | A user can add a net-new stakeholder with a manually chosen quadrant | lib/stakeholders/editing.spec.ts > manual stakeholder management > a user can add a net-new stakeholder with a manually chosen quadrant |
| AC-3.5 | A user can reassign an existing stakeholder to a different quadrant, and it persists | lib/stakeholders/editing.spec.ts > manual stakeholder management > a user can reassign an existing stakeholder to a different quadrant and the change persists |
| AC-3.6 | The map renders an empty state with a visible notice when the MCP source is entirely unavailable | lib/stakeholders/mcp-population.spec.ts > graceful degradation > the map renders an empty state with a visible notice when the MCP source is entirely unavailable |
| AC-3.7 | Incomplete MCP records are excluded and reported, rather than defaulted onto the map | lib/stakeholders/mcp-population.spec.ts > graceful degradation > incomplete MCP records are excluded and reported rather than defaulted into a guessed quadrant |

