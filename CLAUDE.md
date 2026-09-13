# First 90 — Onboarding Accelerator

AI Bootcamp capstone. A productivity app that helps someone starting a new role succeed in
their first 90 days, based on Michael Watkins' *The First 90 Days*.

**Dele Olowoyo is the human orchestrator.** Agents do the work; Dele directs, decides, and
overrides. Decisions that change scope, architecture, or a spec are his — not yours.

> **Context-loading note:** this file is loaded into every session, so it stays short by
> design. Full mechanics live in files loaded on demand — a skill when you invoke it, an ADR
> when you touch the area it governs, `docs/constitution.md` when you need the reasoning
> behind a rule. Follow the pointers below rather than expecting the detail here.

---

## The rules (non-negotiable)

These four sentences govern everything. If an instruction elsewhere conflicts with these, these win.

1. **No implementation without a merged spec.** If there is no `docs/specs/SPEC-00N-*.md`
   covering the work, stop and say so. Do not write code "to explore."
2. **No spec without brainstorming.** Use the `brainstorming` skill before drafting a spec.
   A spec written from a cold prompt is a guess wearing a template.
3. **No PR without `verification-before-completion`.** Self-verify against the spec's
   acceptance criteria, and state which ACs you verified and how.
4. **No fix without `systematic-debugging`.** Reproduce first. Speculative fixes are rejected
   at review even when they work.

A fifth, procedural: **never end a work session with uncommitted changes.** WIP commits are
expected and encouraged (`wip(SPEC-001): AC-1.4 test written, impl pending`). Uncommitted work
is the only unrecoverable state in this project.

**Why these rules, not just what they are:** `docs/constitution.md`.

---

## Working procedure — bound skills

Each phase of work is bound to a specific `superpowers` skill. Invoke the skill; do not
improvise the phase.

| Phase | Skill |
|-------|-------|
| Discovery → spec | `brainstorming` |
| Spec → plan | `writing-plans` |
| Plan → tasks → branches | `executing-plans` |
| Implementation | `test-driven-development` |
| Parallel work | `using-git-worktrees`, `dispatching-parallel-agents` |
| Before any PR | `verification-before-completion` |
| Code review | `requesting-code-review` / `receiving-code-review` |
| Bugs | `systematic-debugging` |
| Branch close-out | `finishing-a-development-branch` |

Superpowers owns the *verb* (how to brainstorm, plan, TDD). The `capstone-conventions` skill
owns the *noun* (the SDD chain, file naming, traceability format, git/PR conventions) — invoke
it whenever producing a spec, plan, task, issue, branch, commit, or PR. No overlap between them.

---

## Session continuity

**Conversation context is a cache. The repo is the database.** Anything that must survive a
`/clear`, a crash, or a closed laptop lives in git — see `docs/constitution.md` principle IV.

- `/resume-capstone` — **first thing typed in any new session.**
- `/checkpoint` — run at every phase boundary, before anything risky, before stepping away.

Full mechanics for both, and the STATE.md/decision-log.md split, live in
`.claude/commands/checkpoint.md` and `.claude/commands/resume-capstone.md` — read those when
actually running the commands, not preemptively here.

---

## Inference — the one architectural fact every agent needs up front

Tests and CI **always** use `LLM_PROVIDER=fixture` — deterministic canned responses, never
live inference. This is non-negotiable regardless of which area you're touching.

If you're working in `lib/inference/`, `services/inference-sidecar/`, or anything
provider-related: read `docs/adr/0001-inference-boundary.md` first — the Agent SDK can't run
inside a container, and the reasoning there explains why and what the fix is. Everyone else
can skip it.

---

## Data policy — hard rule

**No client data. No Slalom-controlled data. No real employee records or statistics.** Every
persona, org chart, calendar entry, and name in this repo is fabricated and lives in
`fixtures/`. This is a capstone requirement, not a preference. If you need data, generate it
and commit the generation prompt alongside it.

## Don't

- Don't add dependencies without saying why in the PR.
- Don't expand a slice mid-build because it "would be easy" — file an issue instead.
- Don't write a test that asserts on LLM prose. Assert on the schema-validated structure.
- Don't reconstruct `STATE.md` from memory at the end. Write it as you go.
