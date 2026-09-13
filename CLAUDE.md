# First 90 — Onboarding Accelerator

AI Bootcamp capstone. A productivity app that helps someone starting a new role succeed in
their first 90 days, based on Michael Watkins' *The First 90 Days*.

**Dele Olowoyo is the human orchestrator.** Agents do the work; Dele directs, decides, and
overrides. Decisions that change scope, architecture, or a spec are his — not yours.

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

---

## Spec-driven development

Specs are the source of truth. Code, tests, issues, and PRs are derived from them and traced
back mechanically.

```text
docs/constitution.md        principles that outrank any individual spec
  └── docs/specs/SPEC-00N    WHAT + WHY. Numbered acceptance criteria (AC-N.M). No how.
       └── docs/plans/PLAN-00N   HOW. Technical approach, interfaces, tradeoffs.
            └── docs/tasks/TASKS-00N   Issue-sized units, each naming the ACs it satisfies.
                 └── GitHub issues     one per task, labeled spec:SPEC-00N
                      └── tests        one named test per AC, written BEFORE implementation
                           └── PR → reviewer agent → CI gate → merge
```

### Acceptance criteria

Every AC is `AC-<spec>.<n>`, independently testable, and written as **observable behaviour** —
what a user or caller can see. Not "the service validates input" but "an intake with fewer
than 50 characters of narrative is rejected with a field-level error naming the field."

Every spec ends with a traceability table mapping each AC to exactly one named test:

| AC | Behaviour | Test |
|----|-----------|------|
| AC-1.1 | Intake with <50 chars of narrative is rejected with a field error | `stars-intake.spec.ts > rejects thin narrative` |

`scripts/check-traceability.ts` parses these tables and **fails CI** if any AC has no matching
test, or any row points at a test that does not exist. It runs as a required status check on
`main`. This is not decoration — it is the gate.

### When a spec turns out to be wrong

Change the spec **first**, in its own PR, before touching the implementation. Then log the
amendment in `docs/decision-log.md` with the reason. Scope drift must be a reviewable event,
never a silent one.

---

## Working procedure — bound skills

Each phase is bound to a specific `superpowers` skill. Invoke the skill; do not improvise the
phase.

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

**Division of labour:** superpowers owns the *verb* (how to brainstorm, plan, TDD). This repo's
`docs/` templates own the *noun* (what a spec, plan, and task file must contain). No overlap.

---

## Session continuity

**Conversation context is a cache. The repo is the database.** Anything that must survive a
`/clear`, a crash, or a closed laptop lives in git.

- `docs/STATE.md` — current snapshot, overwritten at every phase boundary. Where we are.
- `docs/decision-log.md` — append-only narrative. What we decided and why.

Keep these separate. They have different jobs and different lifecycles.

- `/resume-capstone` — **first thing typed in any new session.** Reconciles `STATE.md` against
  live `git`/`gh` state and reports disagreements rather than trusting the file.
- `/checkpoint` — run at every phase boundary, before anything risky, and before stepping away.

If you are an agent finishing a unit of work, update `docs/STATE.md` before handing back.
Capture it while it is true.

---

## Architecture

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · Prisma · Postgres 16 ·
Vitest (unit) · Playwright (e2e) · Docker · Terraform (`kreuzwerker/docker`) · GitHub Actions.

### The inference boundary — read this before touching inference

The Claude Agent SDK authenticates by spawning the `claude` CLI, which reads the macOS keychain.
**Neither exists inside a container.** Inference therefore runs on the host, behind an interface:

```text
app (containerized)
  └── LLM_PROVIDER = fixture | sidecar | anthropic
        ├─ fixture  → fixtures/inference/*.json    DEFAULT in container, CI, and demo fallback
        ├─ sidecar  → http://host.docker.internal:8787
        │              └── services/inference-sidecar (host) → Agent SDK → claude CLI → keychain
        └─ anthropic → @anthropic-ai/sdk, model claude-opus-5, activates on ANTHROPIC_API_KEY
```

All adapters satisfy the contract in `SPEC-000`. Zod-validate at the boundary regardless of
adapter — a schema-constrained response is still untrusted input.

**Tests and CI always use `fixture`.** An LLM app that cannot be tested deterministically cannot
be tested. Never introduce a test that calls live inference.

---

## Conventions

- **Commits:** Conventional Commits with the spec as scope — `feat(SPEC-001): classify intake narrative`.
  Reference the issue: `... (#12)`.
- **Branches:** `spec-001/task-12-classify-intake`
- **PRs:** must carry `Implements: SPEC-001 (AC-1.1, AC-1.3)`. The reviewer agent verifies the
  diff satisfies those ACs *and nothing beyond them*.
- **Tests:** name them exactly as the traceability table says. The table is the contract.

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
