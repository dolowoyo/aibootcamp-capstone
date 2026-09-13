# Constitution

Principles that outrank any individual spec, plan, or convenience. If a spec conflicts with
this document, the spec is wrong.

Amendments require their own PR and an entry in `decision-log.md`.

---

## I. The spec is the source of truth

Code exists to satisfy a spec. Not the other way round. If the implementation and the spec
disagree, one of them is a defect — decide which, in writing, before continuing.

A spec describes **what** and **why** in observable behaviour. It never describes **how**.
That belongs in a plan.

## II. Traceability is mechanical, not aspirational

Every acceptance criterion maps to exactly one named test, and a script enforces it in CI.
A process that depends on remembering to follow it is not a process.

## III. Determinism at the boundary

This is an LLM application, and it must still be testable. Inference sits behind an interface
with a fixture adapter, and every test and CI run uses that adapter. Model output is validated
against a schema before it is trusted, every time, regardless of adapter.

Non-determinism is confined to one named seam. It does not leak.

## IV. The repo is the database

Conversation context is a cache and will be lost. Anything that must survive lives in git:
state, decisions, specs, fixtures, the plan itself.

Never end a session with uncommitted work.

## V. The human orchestrates; agents execute

Agents propose, implement, test, and review. They do not decide scope, architecture, or
whether a spec was right. When an agent hits a decision of that kind it stops and asks.

An agent that guesses at a product decision has exceeded its authority, even when it guesses
correctly.

## VI. Scope drift is a reviewable event

Cutting scope is legitimate and often correct. Cutting it silently is not. Amend the spec in
its own PR, log why, and move on.

Work that is descoped becomes a filed issue, never a deleted paragraph.

## VII. Fabricated data only

No client data. No Slalom-controlled data. No real people. Every persona and org fixture is
synthetic, and the prompt that generated it is committed beside it.

## VIII. The evidence trail is the deliverable

This is a capstone. A working app with no visible trail of how it was built is a failure of the
assignment. Issues, specs, PRs, reviews, and CI runs are the product; the app is the vehicle.

Capture decisions while they are true, not in a retrospective sweep at the end.

## IX. Ship the cut, not the ambition

A narrow slice that works end to end beats three half-built ones. When time pressure forces a
choice, cut scope and keep quality. Record the cut and move.
