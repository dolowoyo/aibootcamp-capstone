---
name: capstone-conventions
description: The repo-specific conventions for the First 90 capstone — SDD file locations, naming, labels, and the traceability contract. Reference this whenever creating a spec, plan, task, issue, branch, commit, or PR in this repo.
---

# Capstone conventions

This is the noun half of the project's process (superpowers skills are the verb half — see
`CLAUDE.md`). Use this whenever producing an artifact in this repo, so every agent produces
the same shape without re-deriving it each time.

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
observable behaviour a user or test can verify — never as an internal implementation detail.

## Traceability table

Every spec's `## Traceability` section is a markdown table with exactly these three columns,
in this order: `AC | Behaviour | Test`. The Test column format is always
`path/to/file.spec.ts > describe block > test name` — this exact string (or a prefix of it
ending after the file path, if there's no describe block) is what
`scripts/check-traceability.ts` parses and verifies against the real test file.

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
