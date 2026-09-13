---
name: capstone-conventions
description: The repo-specific conventions for the First 90 capstone — SDD file locations, naming, labels, and the traceability contract. Reference this whenever creating a spec, plan, task, issue, branch, commit, or PR in this repo.
---

# Capstone conventions

This is the noun half of the project's process (superpowers skills are the verb half — see
`CLAUDE.md`). Use this whenever producing an artifact in this repo, so every agent produces
the same shape without re-deriving it each time.

## The SDD chain

Specs are the source of truth. Code, tests, issues, and PRs are derived from them and traced
back mechanically:

```text
docs/constitution.md        principles that outrank any individual spec
  └── docs/specs/SPEC-00N    WHAT + WHY. Numbered acceptance criteria (AC-N.M). No how.
       └── docs/plans/PLAN-00N   HOW. Technical approach, interfaces, tradeoffs.
            └── docs/tasks/TASKS-00N   Issue-sized units, each naming the ACs it satisfies.
                 └── GitHub issues     one per task, labeled spec:SPEC-00N
                      └── tests        one named test per AC, written BEFORE implementation
                           └── PR → reviewer agent → CI gate → merge
```

`scripts/check-traceability.ts` parses every spec's traceability table and enforces it in two
tiers, so a spec can merge (fixing its contract) before its tests exist without permanently
redding out `main`'s required checks: **Tier 1** (always) — every AC has exactly one
well-formed traceability row, no dangling or duplicate references. **Tier 2** (only once a
spec's `Status:` is `implemented`) — every row must resolve to a real, existing test. Flip a
spec to `implemented` in the same PR that adds its tests — from then on, deleting a row or a
test fails CI exactly as intended (`docs/constitution.md`, principle II).

**When a spec turns out to be wrong:** change the spec first, in its own PR, before touching
the implementation, then log the amendment in `docs/decision-log.md` with the reason. Scope
drift must be a reviewable event, never a silent one (principle VI).

## File locations and naming

| Artifact | Path | Naming |
|---|---|---|
| Constitution | `docs/constitution.md` | singular, no numbering |
| Spec | `docs/specs/SPEC-00N-<slug>.md` | zero-padded 3 digits, kebab-case slug |
| Plan | `docs/plans/PLAN-00N-<slug>.md` | matches its spec's number |
| Tasks | `docs/tasks/TASKS-00N-<slug>.md` | matches its spec's number |
| ADR | `docs/adr/000N-<slug>.md` | independent numbering from specs |
| State snapshot | `docs/STATE.md` | singular, overwritten not appended |
| Decision log | `docs/decision-log.md` | singular, append-only |

## Acceptance criteria

Format: `AC-<spec-number>.<sequence>`, e.g. `AC-1.1`, `AC-1.2`, `AC-2.1`. Always written as
**observable behaviour** a user or test can verify — never as an internal implementation
detail. Not "the service validates input" but "an intake with fewer than 50 characters of
narrative is rejected with a field-level error naming the field."

## Traceability table

Every spec's `## Traceability` section is a markdown table with exactly these three columns,
in this order: `AC | Behaviour | Test`. The Test column format is always
`path/to/file.spec.ts > describe block > test name`, written **plain, without backtick
wrapping** — this exact string (or a prefix of it ending after the file path, if there's no
describe block) is what `scripts/check-traceability.ts` parses and verifies against the real
test file. (The script strips leading/trailing backticks defensively, but don't rely on
that — the table is parsed as data, not rendered as code, so write it plain.)

Get this format wrong and the traceability gate silently mis-parses the row — when writing
or editing a traceability table, run `npm run check:traceability` immediately after to catch
it before it reaches review.

## Git conventions

- **Branches:** `spec-00N/task-<issue-number>-<short-slug>`
- **Commits:** Conventional Commits, spec-scoped: `feat(SPEC-001): classify intake narrative (#12)`
  - WIP commits are fine and expected: `wip(SPEC-001): AC-1.4 test written, impl pending`
  - Spec/plan/task doc changes: `docs(SPEC-001): add stakeholder map traceability row`
- **PRs:** body must include a line `Implements: SPEC-00N (AC-N.M, AC-N.K, ...)` naming every
  AC the PR satisfies — no more, no fewer than what the diff actually does.

## Labels

`epic` · `story` · `task` · `spike` · `bug` · `spec:SPEC-000` … `spec:SPEC-003` ·
`agent:builder` · `agent:qa` · `agent:platform` · `session-N` (traces the artifact to a
learning-roadmap session, e.g. `session-4` for the MCP server, `session-7` for platform work)

## Milestones

`SPEC-001 — STARS` · `SPEC-002 — Plan` · `SPEC-003 — Stakeholders` · `Backlog — Post-Capstone`

## GitHub Project board columns

`Backlog` → `Spec` → `Plan/Tasks` → `In Progress` → `In Review` → `Done`

An issue's column should reflect where it actually is in the SDD chain, not just "open" vs
"closed" — that's what makes the board itself a demoable artifact.
