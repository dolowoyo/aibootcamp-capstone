---
name: watkins-framework
description: Reference for Michael Watkins' "The First 90 Days" framework — the STARS model, 30/60/90 milestones, stakeholder/coalition mapping, and the five conversations. Use when translating the book's concepts into product decisions, specs, or fixture data.
---

# The First 90 Days — framework reference

Use this to keep product decisions, specs, and fabricated fixture data grounded in the
actual framework rather than a generic "onboarding app" gloss. This is domain reference, not
implementation guidance.

## STARS — situation diagnosis

Every new role sits in one of five situation types, and the right early strategy differs by
type:

- **Startup** — building something from scratch: no existing team/process/systems.
- **Turnaround** — fixing a recognized, serious problem under time pressure.
- **Accelerated growth** — managing rapid scale of an already-working operation.
- **Realignment** — reviving a unit that's drifted from what it should be doing, often before
  the problem is widely recognized.
- **Sustaining success** — preserving and building on something that's already working well.

The diagnosis isn't binary — real situations often blend two (e.g. turnaround + realignment).
A good STARS classification names the dominant type, the secondary if present, and the
specific evidence from the intake narrative that supports it.

## The 30/60/90 milestone structure

- **Days 1–30:** learning-first. Understand the business, the team, the culture, the
  technical/operational reality. Identify early-win candidates without committing yet.
- **Days 31–60:** early wins. Ship 1–3 visible, meaningful improvements that build credibility
  and momentum — chosen for both real value and symbolic importance.
- **Days 61–90:** strategy and plan. With credibility and context now established, define the
  medium-term plan and begin larger structural moves if the situation calls for them.

Milestones should be situation-aware: a Startup's 30 days look different from a Turnaround's.

## Stakeholder / coalition mapping

Map people by two axes: **influence** (how much power they have over your success) and
**support** (how aligned they currently are with where you're headed). This produces four
quadrants — allies to leverage, opponents to convert or neutralize, people to keep informed,
and people to monitor. The map should be built from real interaction data where possible
(who you're actually meeting with) rather than assumed org-chart hierarchy.

## The five conversations

Watkins frames the early relationship with a new boss as five conversations that should
happen deliberately, not accidentally: situational diagnosis, expectations, style, resources,
and personal development. Each has a distinct purpose and shouldn't be collapsed into one
generic "sync."

## Using this in fixture data

When generating synthetic org/persona data (`fixtures/synthetic-org.json`), make sure the
situation is coherent: a "Turnaround" persona's fabricated org chart, meeting cadence, and
stakeholder sentiment should actually look like a turnaround, not a generic company. This is
what makes the demo read as a real application of the framework rather than a form with an
LLM call attached.
