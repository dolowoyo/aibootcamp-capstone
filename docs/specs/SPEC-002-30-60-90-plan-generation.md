# SPEC-002 — 30/60/90 plan generation

**Status:** approved
**Owner:** architect
**Depends on:** SPEC-000 (inference provider contract — this spec consumes the `generatePlan`
operation and owns the field contents of the milestone/plan shape SPEC-000 deliberately left
open); SPEC-001 (this spec's input is a `StarsDiagnosis` — specifically its effective type,
inclusive of any user correction per SPEC-001's AC-1.7)

## Context & problem

A STARS diagnosis on its own tells a new leader what kind of situation they're in, but not
what to actually do about it in their first 90 days. Watkins is explicit that the 30/60/90
structure itself — Days 1–30 learning-first, 31–60 early wins, 61–90 strategy and structural
moves — is situation-aware, not a single template: a Startup's first 30 days looks nothing
like a Turnaround's. A plan generated without the diagnosis behind it is a generic checklist
with a new label on it.

This spec covers turning a diagnosis into an editable, situation-shaped 30/60/90 milestone
plan: the plan's content differing meaningfully by situation type, each milestone carrying a
rationale the leader can point to, the leader's ability to adapt the plan rather than being
stuck with whatever was generated, a way to take the finished plan out of the app, and what
happens if a plan is requested before any diagnosis exists to shape it.

## User outcomes

- A new leader with a STARS diagnosis can generate a 30/60/90-day milestone plan whose content
  is shaped by their specific situation type, not a generic template that would read the same
  regardless of situation.
- A new leader can see why each milestone was suggested, tied to their situation, well enough
  to explain and defend the plan in a real conversation with their own boss.
- A new leader can edit milestone text, add a milestone, and move a milestone between phases,
  so the generated plan is a starting draft they adapt, not a script they're stuck with.
- A new leader can produce a shareable version of their current plan — including whatever
  edits they've made — so it can actually be used outside the app.
- A new leader who tries to generate a plan before completing a STARS diagnosis is told
  clearly that a diagnosis is required first, rather than getting a plan with no situation
  basis behind it.

## Acceptance criteria

- **AC-2.1** — Given a STARS diagnosis, the generated plan's milestones are grouped into
  exactly three phases: Days 1–30, Days 31–60, and Days 61–90.
- **AC-2.2** — Given two diagnoses with different dominant STARS types (e.g. Startup and
  Turnaround), the Days 1–30 milestone content generated for each is not textually
  interchangeable between them.
- **AC-2.3** — Every milestone in a generated plan includes a rationale field that references
  the diagnosis's dominant situation type (or content from the diagnosis's own rationale),
  rather than being blank or identical boilerplate text across situation types.
- **AC-2.4** — A user can edit an existing milestone's text, and the edited text is what is
  returned on subsequent retrieval of that plan.
- **AC-2.5** — A user can add a new milestone to any of the plan's three phases, and the added
  milestone is present on subsequent retrieval of that plan.
- **AC-2.6** — A user can move an existing milestone to a different phase, or to a different
  position within its current phase, and that placement is what is returned on subsequent
  retrieval of that plan.
- **AC-2.7** — A user can produce a shareable export of their current plan that reflects all
  three phases and includes every edit made under AC-2.4–AC-2.6, not just the originally
  generated content.
- **AC-2.8** — Requesting plan generation when no STARS diagnosis exists for the current user
  is rejected with a distinguishable error naming that a diagnosis is required first, rather
  than producing a plan with no situation basis or crashing.

## Out of scope

- Automatically regenerating an already-generated plan when its underlying diagnosis is later
  corrected (SPEC-001 AC-1.7) — see Open questions.
- Multi-user collaboration or simultaneous editing of the same plan.
- Versioning or history across multiple plan generations for the same diagnosis — this spec
  covers one current plan state per diagnosis, editable in place.
- The specific export file format (e.g. PDF vs. Markdown vs. copy-to-clipboard) — an
  implementation choice for the plan, not an acceptance criterion here.
- The exact UI mechanics for editing, reordering, or adding milestones (drag-and-drop vs. form
  controls) — interaction design belongs to the plan and implementation, not this spec.
- Localization or non-English plan content.

## Open questions

- ~~Does correcting a diagnosis (SPEC-001 AC-1.7) automatically regenerate an already-existing
  plan?~~ **Resolved 2026-09-13 with Dele:** no — an existing plan is never silently
  regenerated or discarded, since that would destroy edits already made under
  AC-2.4–AC-2.6 without the user asking for it. Regeneration is always an explicit user
  action; the UI should surface that the diagnosis changed and offer, not force, that action.
- **Exact export format.** Deliberately left to `PLAN-002` — this spec only requires that
  *some* shareable representation exists and reflects current edits (AC-2.7).
- **What happens to milestone order/IDs across a full plan regeneration** (as opposed to an
  in-place edit) — not addressed here since AC-2.1–AC-2.3 describe a single generation event.
  Now that regeneration is confirmed to be an explicit, user-triggered action (not automatic),
  `PLAN-002` should specify how it treats prior edits when the user does choose to regenerate
  (discard and regenerate fresh vs. attempt to preserve — a reasonable default is discard,
  since the user explicitly opted into a fresh generation, but PLAN-002 should state this
  outright rather than leave it implicit).

## Traceability

| AC | Behaviour | Test |
|----|-----------|------|
| AC-2.1 | Generated milestones are grouped into exactly three phases (1-30, 31-60, 61-90) | lib/plan/generation.spec.ts > plan generation > returns milestones grouped into Days 1-30, 31-60, and 61-90 phases |
| AC-2.2 | Day 1-30 content differs meaningfully between a Startup diagnosis and a Turnaround diagnosis | lib/plan/generation.spec.ts > plan generation > Day 1-30 milestones differ between a Startup diagnosis and a Turnaround diagnosis |
| AC-2.3 | Every milestone includes a rationale referencing the diagnosis's situation type | lib/plan/generation.spec.ts > plan generation > every milestone includes a rationale referencing the diagnosis situation type |
| AC-2.4 | Editing a milestone's text persists across retrieval | lib/plan/editing.spec.ts > plan editing > editing a milestone's text persists on subsequent retrieval |
| AC-2.5 | Adding a milestone to a phase persists across retrieval | lib/plan/editing.spec.ts > plan editing > adding a milestone to a phase persists on subsequent retrieval |
| AC-2.6 | Moving a milestone to a different phase or position persists across retrieval | lib/plan/editing.spec.ts > plan editing > moving a milestone to a different phase or position persists on subsequent retrieval |
| AC-2.7 | Exporting the plan reflects all three phases and all prior edits | lib/plan/export.spec.ts > plan export > exporting the current plan reflects all three phases and all edits made to it |
| AC-2.8 | Requesting a plan with no existing diagnosis is rejected with a distinguishable error | lib/plan/generation.spec.ts > plan generation > requesting a plan with no existing diagnosis is rejected with a distinguishable error |

