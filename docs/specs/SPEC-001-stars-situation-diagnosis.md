# SPEC-001 — STARS situation diagnosis

**Status:** implemented
**Owner:** architect
**Depends on:** SPEC-000 (inference provider contract — this spec consumes the `diagnoseStars`
operation and owns the field contents of the `StarsDiagnosis` shape SPEC-000 deliberately left
open)

## Context & problem

A new leader arrives with a narrative understanding of their situation but no structured
read on what *kind* of situation it is. Watkins' STARS model claims the right early strategy
is situation-dependent — a Startup and a Turnaround call for different first moves — but most
new leaders never diagnose explicitly; they default to a generic "listen for 30 days" script
regardless of what they've actually walked into.

This spec covers turning a free-text description of a new role into a classified situation:
one of Startup, Turnaround, Accelerated Growth, Realignment, or Sustaining Success, with a
rationale grounded in the leader's own words, a legible confidence signal, and room for the
situation to genuinely be a blend of two types rather than a forced single label. It also
covers what happens when the input is too thin to say anything, and when the leader disagrees
with what came back.

## User outcomes

- A new leader can submit a free-text narrative describing their new role and receive back a
  classified STARS situation type with a plain-language rationale tied to what they actually
  wrote, instead of a generic label.
- A new leader can see how confident the system is in that classification and which specific
  parts of their own narrative support it, so they can judge whether to trust it rather than
  treating it as a black box.
- A new leader whose situation is genuinely mixed (e.g. Turnaround + Realignment) sees both a
  dominant and a secondary classification, instead of a single label that flattens a real
  blend into a false binary.
- A new leader who disagrees with the classification can correct it, and that correction — not
  the original system guess — is what carries forward into their 30/60/90 plan (SPEC-002).
- A new leader whose narrative is too thin or generic to strongly support any single type
  still gets a usable answer, honestly labeled as low-confidence, rather than either a refusal
  or a falsely confident guess.

## Acceptance criteria

- **AC-1.1** — An intake with fewer than 50 characters of narrative is rejected with a
  field-level error naming the `narrative` field, rather than being sent for diagnosis.
- **AC-1.2** — Given a narrative of at least 50 characters, the diagnosis returned contains
  exactly one dominant STARS type, drawn from the five defined types (Startup, Turnaround,
  Accelerated Growth, Realignment, Sustaining Success).
- **AC-1.3** — The diagnosis's rationale contains at least one specific reference — a quoted
  phrase or a clearly traceable paraphrase — to content actually present in the submitted
  narrative, distinguishing it from boilerplate text that would be identical regardless of
  what was submitted.
- **AC-1.4** — The diagnosis includes a confidence level drawn from a fixed, ordered set of
  values (Low, Medium, High).
- **AC-1.5** — The diagnosis includes at least one evidence excerpt that is directly
  attributable to the submitted narrative and supports the dominant classification.
- **AC-1.6** — When the narrative provides comparable evidentiary support for a second
  situation type, the diagnosis includes a secondary type, distinct from the dominant type and
  explicitly labeled as secondary; when it does not, the diagnosis contains no secondary type
  field populated with a guessed value.
- **AC-1.7** — After receiving a diagnosis, a user can submit a corrected STARS type; any plan
  generation (SPEC-002) requested afterward for that diagnosis uses the corrected type, not
  the originally classified one.
- **AC-1.8** — Given a narrative that passes the 50-character minimum but contains no
  distinguishing signal for any situation type, the diagnosis returned is marked with Low
  confidence and its rationale explicitly states that the evidence was limited, rather than
  returning a fabricated high-confidence classification.

## Out of scope

- Multi-turn, conversational refinement of a diagnosis (e.g. follow-up questions from the
  system to disambiguate) — a single intake produces a single diagnosis; not yet filed as a
  backlog issue.
- A maximum narrative length or truncation policy — not addressed here.
- Non-English narrative input.
- Persisting a history of multiple diagnoses over time for the same user/role — this spec
  covers one diagnosis (with at most one correction) per role intake, not a revision history.
- The exact UI mechanics for submitting a narrative or displaying a correction control —
  interaction design belongs to the plan and implementation, not this spec.

## Open questions

- ~~Minimum narrative length threshold.~~ **Resolved 2026-09-13:** 50 characters, confirmed.
- ~~Confidence representation.~~ **Resolved 2026-09-13:** categorical (Low/Medium/High),
  confirmed — legible to a non-technical user and trivially deterministic against fixture
  data.
- ~~Thin/ambiguous-input behavior.~~ **Resolved 2026-09-13 with Dele:** best-fit dominant type
  at Low confidence with an explicit limited-evidence caveat, never a refusal — the pipeline
  never leaves a user stuck with nothing, and the UI can still visibly invite more detail.
- ~~Retrievability of the original diagnosis after a correction (AC-1.7).~~ **Resolved
  2026-09-13 with Dele:** the original diagnosis is preserved internally (not exposed as its
  own required AC in this spec) specifically so a future explicit "regenerate the plan"
  action (see SPEC-002's matching resolution) has something to diff against. It does not need
  to be user-visible on its own.

## Traceability

| AC | Behaviour | Test |
|----|-----------|------|
| AC-1.1 | Narrative under 50 characters is rejected with a field-level error naming `narrative` | lib/stars/intake-validation.spec.ts > intake validation > rejects a narrative under 50 characters with a field-level error naming narrative |
| AC-1.2 | A valid narrative produces exactly one dominant STARS type from the five defined types | lib/stars/diagnosis.spec.ts > STARS classification > returns exactly one dominant STARS type for a valid narrative |
| AC-1.3 | The rationale references specific content from the submitted narrative, not boilerplate | lib/stars/diagnosis.spec.ts > STARS classification > rationale references specific content from the submitted narrative |
| AC-1.4 | The diagnosis includes a confidence level from a fixed Low/Medium/High set | lib/stars/diagnosis.spec.ts > STARS classification > diagnosis includes a confidence level drawn from a fixed set |
| AC-1.5 | The diagnosis includes at least one evidence excerpt attributable to the narrative | lib/stars/diagnosis.spec.ts > STARS classification > diagnosis includes at least one evidence excerpt from the narrative |
| AC-1.6 | A blended narrative produces a distinct, explicitly labeled secondary type; a non-blended one does not | lib/stars/diagnosis.spec.ts > blended situations > returns a distinct secondary type only when narrative evidence supports a second situation type |
| AC-1.7 | A user's corrected STARS type, not the original, is used by downstream plan generation | lib/stars/override.spec.ts > diagnosis override > a corrected STARS type is used by downstream plan generation instead of the original classification |
| AC-1.8 | A thin but valid narrative returns Low confidence with an explicit limited-evidence rationale | lib/stars/diagnosis.spec.ts > ambiguous input handling > a thin but valid narrative returns Low confidence with an explicit limited-evidence rationale |

