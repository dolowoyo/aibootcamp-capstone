# First 90 — Capstone Demo Script (5:00 target)

Written to be read aloud on camera. `[SAY]` blocks are narration; `[DO]` blocks are what to
click/show/type. Timings are targets, not hard stops — if a beat runs long, cut from "What
I'd do differently" first (shortest, most compressible), then trim gotchas to 2 instead of
4. Don't cut the live `terraform apply` or the traceability-gate demo — those are the two
moments that prove the process was real, not narrated.

Pre-flight, before hitting record:
- [ ] `docker compose down -v` (clean slate) — do NOT pre-run `terraform apply`, that has to
      happen live in the 2:15 beat.
- [ ] Confirm `git log --oneline -5` on `main` shows the real merge history you're about to
      talk through.
- [ ] Have `docs/decision-log.md` open in a second tab/window to read exact numbers from
      live if memory fails on a beat.
- [ ] Confirm `infra/terraform` — `terraform state list` is empty (destroyed, per the last
      checkpoint) so the live apply is genuinely "from nothing."

---

## 0:00–0:45 — Overview (45s)

**[SAY]**
"Most new leaders wing their first 90 days. Michael Watkins' research says that window is
what decides whether a hire succeeds — but almost nobody gets structured help through it.
First 90 is an AI-assisted onboarding accelerator built around that framework: you describe
your new role, it diagnoses your situation using Watkins' STARS model, generates a real
30/60/90-day plan, and helps you map the stakeholders you'll need on your side."

**[DO]** Show the running app (`docker compose up --build`, already warm — this beat is
about the product, not the infra, that comes later):
- `/diagnosis` — paste a real narrative, submit, show the STARS result (dominant type,
  confidence, rationale grounded in your actual words, evidence excerpts).
- `/plan` — generate, show milestones grouped across Days 1-30/31-60/61-90, each with a
  rationale tied to the situation type.
- `/stakeholders` — add one manually, show it land in the correct influence/support
  quadrant.

**[SAY]** "That's the product. The more interesting story is how it got built."

---

## 0:45–2:15 — How I leveraged AI (90s)

**[SAY]**
"This wasn't 'ask an AI to write code.' It's spec-driven development: every piece of work
traces back to a written spec with numbered acceptance criteria, enforced mechanically in
CI — not by convention, by a script that fails the build if a spec's traceability table and
its tests disagree."

**[DO]** Show the chain on screen: `docs/constitution.md` → a `docs/specs/SPEC-00N` file →
its `docs/plans/PLAN-00N` → `docs/tasks/TASKS-00N` → a closed GitHub issue → the test file
its traceability table points at → the merged PR.

**[SAY]**
"Seven custom agent roles did the actual work — architect, builder, qa-engineer, platform-
engineer, reviewer, product-owner, demo-producer — each bound to a specific superpowers
skill for its phase: brainstorming before a spec, TDD before implementation, a real code
review before merge. Block 2 ran three of them in parallel git worktrees — one on the app
slice, one on the MCP server and inference sidecar, one on the Docker/Terraform platform —
and they came back as three independent PRs I merged in sequence, resolving the conflicts
that only show up once parallel work rejoins."

**[DO]** Show `.claude/agents/*.md`, and the three merged Block 2 PRs (#61, #62, #63) in the
PR list.

**[SAY]**
"The stakeholder map is backed by a real MCP server — `mcp/onboarding-context` — serving
the same synthetic org data to both the running app and to the dev agents that built
against it, from one documented tool contract instead of two teams guessing at each
other's shapes."

---

## 2:15–3:00 — Platform + the gate (45s)

**[SAY]** "This is real infrastructure, not a mock. Local IaC against a real Terraform
provider, because there's no cloud account for this capstone — the provider targets the
local Docker daemon directly."

**[DO]** Live, on camera:
```sh
cd infra/terraform
terraform apply -var="image_tag=0.1.0"
```
Let it actually run — network, Postgres, a one-off migration container that applies the
Prisma schema, then the app container, pulling the real image from GHCR. Then:
```sh
curl http://localhost:3000/api/healthz
curl http://localhost:3000/api/readyz
```
Both `200`, `readyz` confirming a real Postgres query succeeded, not just that a process
is running.

**[SAY]**
"And here's the proof the spec process isn't decorative."

**[DO]** Open a spec's traceability table, delete one row, commit, push, show the
`traceability` required check go red in the PR within seconds. Then revert.

**[SAY]** "Ten seconds. That's the whole claim — the method isn't a story I'm telling you,
it's a thing CI would have stopped me from lying about."

---

## 3:00–4:15 — Learnings + gotchas (75s)

Pick 3-4 of these live, in whichever order feels natural — don't try to fit all of them:

1. **The auth wall that shaped the architecture.** The Claude Agent SDK authenticates by
   spawning the `claude` CLI, which reads the macOS keychain — neither exists inside a
   Docker container. Rather than narrow the project to avoid that, split the process
   boundary: a host-side inference sidecar owns the SDK and the keychain; the containerized
   app talks to it over HTTP. Fixture mode is still the default everywhere else, so the
   container itself never needs credentials of any kind.

2. **Determinism at the boundary.** Tests and CI never call live inference — a fixture
   adapter behind the same interface makes an LLM app testable at all. That's not a
   workaround; an app that can't be tested deterministically can't be tested, full stop.

3. **"CI is green" isn't evidence — what it actually ran is the evidence.** One PR's
   checks were all green because its branch predated the real CI commands landing on
   `main` — the checks had genuinely passed, running literal `echo` placeholders from
   Block 0. Caught by checking out the branch and running the real commands by hand before
   merging, not by trusting the badge.

4. **Today's freshest one:** publishing the app's Docker image for the very first time —
   needed for the Terraform beat you just watched — surfaced four independent, unrelated
   bugs in a row, each hidden behind the last, in a workflow file that had existed since
   early in the project but had genuinely never once executed: a wrong version tag on a
   security-scanning action, that action's own dead internal dependency, real CVEs in the
   image once the scanner could finally run, and a build that only worked for one CPU
   architecture. None of it showed up in code review. All of it showed up the first time
   someone actually ran the thing.

5. **Specs with numbered ACs, not vibes, are what kept seven agents from drifting** —
   traceable, falsifiable claims a reviewer (human or agent) can check line by line,
   instead of "looks right to me."

**[SAY, to close this beat]** "Every one of those is in the repo's decision log, dated,
with what was tried and why — not reconstructed after the fact for this video."

---

## 4:15–5:00 — What I'd do differently (45s)

**[SAY]**
"Three things. First: I'd build the traceability gate before writing the first spec, not
alongside it — I found two real design gaps in that gate only because I happened to try
using it for real before trusting it, and that should have been step zero, not a
mid-project scramble.

Second: a narrower first slice. Watkins' framework has five conversations, a full
organizational-alignment model, a coalition action planner — I scoped to one vertical slice
end to end instead, and that was the right call, but I'd cut even tighter next time and
expand only once the spine actually held weight.

Third, and the one I didn't expect going in: context engineering was the real force
multiplier, more than any individual model or agent. Duplicating the same rules directly
into each agent's own definition worked better than trusting one shared instructions file —
loaded once, at the top, regardless of which of the seven roles actually needed it that
turn. What an agent can act on reliably is what's actually in its own context, not what's
merely true somewhere in the repo."

**[DO]** End on the running app, or the merged PR list — whichever framed better on replay.

---

## Notes for editing

- If a beat runs short, the platform beat (2:15) has room — showing the full `terraform
  apply` output scroll by is good b-roll, don't cut it short in the raw take even if you
  trim it later.
- The traceability-gate demo (delete a row, watch CI go red) is the single most important
  10 seconds in the video. If anything gets re-shot, it's not that.
- Decision log entries worth reading verbatim on camera if a gotcha needs more precision
  than memory gives you, in rough order of how well they demo: the 2026-09-15 publish.yml
  entry (freshest, most concrete), the 2026-09-14 "CI green checkmarks were misleading"
  entry, the 2026-09-13 traceability-gate redesign entry, the 2026-09-13 sidecar-boundary
  planning entry.
