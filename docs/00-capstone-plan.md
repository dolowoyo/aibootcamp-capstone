# AI Bootcamp Capstone — "First 90" Onboarding Accelerator

> **Status:** Approved 2026-09-13 · **Author:** Dele Olowoyo (human orchestrator)
> **Provenance:** Produced collaboratively in Claude Code plan mode. Preserved verbatim
> as a capstone artifact — this is the plan the build was actually executed against,
> not a retrospective write-up. Where execution diverged from it, the divergence is
> recorded in [`decision-log.md`](decision-log.md), not edited into this file.
>
> Live progress against this plan lives in [`STATE.md`](STATE.md).

## Context

Dele is delivering the capstone for Slalom's AI Bootcamp (Session 8 demo). The project must visibly exercise all eight sessions on the learning roadmap — context engineering, discovery/design, AI coding assistants, MCP, agentic development, spec-driven development, and platform engineering — and be presented as a 5-minute video covering: project overview, how AI was leveraged, key learnings, gotchas, and what he'd do differently.

**The graded artifact is the evidence trail, not the app.** A polished product with no visible AI-orchestration story scores worse than a modest vertical slice with GitHub issues traced to specs, specs traced to PRs, PRs reviewed by agents, and CI enforcing the gate. The app is the vehicle; the repo is the exhibit. Every decision below optimizes for that.

**Domain:** Michael Watkins' *The First 90 Days*. Ship one vertical slice — **STARS situation diagnosis → generated 30/60/90 plan → stakeholder/coalition map**. Everything else in the book becomes filed backlog issues, which is itself evidence of AI-assisted discovery.

**Method:** the whole project runs as **spec-driven development**. Specs are the source of truth; code, tests, issues, and PRs are all derived from them and mechanically traced back. See the SDD section below — it is the spine of the plan, not a phase within it.

**Hard deadline:** tomorrow (2026-09-14) evening. ~1.5 working days.

### Constraints established
- Repo `dolowoyo/aibootcamp-capstone` is **public** ✓ (done) and empty — default labels, no commits. Public unlocks branch protection + required status checks on a free account.
- Terraform installed via Homebrew ✓ (done) — re-verify `terraform version` in a fresh shell at Block 3.
- **No client or Slalom-controlled data** — capstone rule. All persona, org, and calendar data is AI-fabricated and committed as fixtures.
- **No cloud accounts** (no Vercel/Fly/AWS). Deploy target is local Docker, with GHCR as the published artifact registry and Terraform's `kreuzwerker/docker` provider as real IaC.
- **No Anthropic API key.** Inference runs through the **Claude Agent SDK on existing Claude Code subscription auth**.
- Available: Node 20, npm 10, Python 3.14, uv, Docker 29, `gh` 2.98 (authed as `dolowoyo`, scopes `repo`/`workflow`/`gist`/`read:org`). Terraform and AWS CLI are **not** installed — Terraform needs `brew install terraform`.
- Machine: Apple M5 Pro, 48 GB RAM.

---

## Spec-driven development (the spine)

Run the SDD artifact chain **by hand** — templates and agents we control — with `github/spec-kit` cited as the reference model in the video. Rejected installing spec-kit: its `/plan` and `/implement` commands collide with superpowers' `writing-plans`/`executing-plans`, and resolving that ownership question costs time we don't have. We get the same artifacts and a cleaner story.

### The chain

```
docs/constitution.md          non-negotiable project principles
      ↓
docs/specs/SPEC-00N-*.md      WHAT + WHY. Numbered acceptance criteria (AC-N.M).
      ↓                       No implementation detail.
docs/plans/PLAN-00N-*.md      HOW. Technical approach, interfaces, tradeoffs.
      ↓
docs/tasks/TASKS-00N-*.md     Issue-sized units, each naming the ACs it satisfies.
      ↓
GitHub issues                 one per task, labeled spec:SPEC-00N
      ↓
tests                         one named test per AC, written BEFORE implementation
      ↓
implementation → PR → reviewer agent verifies against spec → CI gate → merge
```

### Spec template (`docs/specs/_TEMPLATE.md`)

Context & problem · User outcomes · **Acceptance criteria** (`AC-N.M`, each independently testable, written as observable behaviour) · Out of scope · Open questions · **Traceability table**.

Every spec ends with:

| AC | Behaviour | Test |
|---|---|---|
| AC-1.1 | Intake with <50 chars of narrative is rejected with a field error | `stars-intake.spec.ts > rejects thin narrative` |

### The hard gate

**No branch exists without a merged spec.** Enforcement, in order of cost:

1. **`scripts/check-traceability.ts`** — parses every `docs/specs/SPEC-*.md` traceability table, collects the referenced test names, runs `vitest list` + `playwright test --list`, and **exits non-zero if any AC has no matching test** or any table row points at a test that doesn't exist. ~30 min to build. This is the demo moment: break a spec row, watch CI go red.
2. **CI job `traceability`** — added to the required status checks on `main` alongside `lint`/`typecheck`/`unit`/`e2e`/`build`.
3. **PR template** requires a `Implements: SPEC-00N (AC-1.1, AC-1.3)` line; the `reviewer` agent's checklist verifies the diff actually satisfies those ACs and nothing beyond them.
4. **Spec amendments are their own PR** — if implementation reveals the spec was wrong, you change the spec first, in a visible commit. Scope drift becomes a reviewable event instead of an invisible one. Log each amendment in `decision-log.md`.

### The three specs

- `SPEC-001` — STARS situation diagnosis (intake → classified situation + rationale + confidence)
- `SPEC-002` — 30/60/90 milestone plan generation (diagnosis → editable milestones)
- `SPEC-003` — Stakeholder & coalition map (MCP-sourced org/calendar data → influence×support grid)

Plus `SPEC-000` — the inference provider contract, which the fixture/sidecar/anthropic adapters must all satisfy. Writing this one first is what makes fixture-first testing possible.

### Why this is the right call here

Specs are how you keep seven agents from drifting. An agent given a spec with numbered, testable ACs produces reviewable work; an agent given a paragraph produces plausible work you have to read line by line. That claim is the substance of your "key learnings" segment — and the traceability checker is the evidence that you actually ran it that way.

---

## Session continuity & durable memory

**Principle: conversation context is not storage.** Anything that must survive a `/clear`, a crashed session, a closed laptop, or tomorrow morning lives **in the repo, committed to git**. The transcript is a cache; the repo is the database. `claude --resume` and `--continue` are convenience only — they're machine-local, don't survive a context clear, and can't be handed to a fresh agent.

This is cheap to build (~20 min) and it's also directly on-theme: context engineering is Session 2, and "how I survived losing context mid-build" is a stronger video beat than most of the feature work.

### `docs/STATE.md` — the single resume file

One git-tracked file, overwritten (not appended) at every phase boundary. Small enough to read in ten seconds:

```markdown
# Current State — updated 2026-09-14T14:32
Block: 2 (parallel build)
Active specs: SPEC-001 ✅merged · SPEC-002 ✅merged · SPEC-003 ⏸cut to backlog

## In flight
- wt-app      builder    TASKS-001 #3,#4 done · #5 in progress (AC-1.4 test written, impl started)
- wt-mcp      builder    TASKS-002 #8 done · PR #14 open, awaiting review
- wt-platform platform   TASKS-003 #11 in progress · terraform module not started

## Next 3 actions
1. Review + merge PR #14 (MCP server)
2. Finish AC-1.4 impl in wt-app, run check-traceability
3. Start terraform docker provider module

## Blockers / open decisions
- Sidecar returns 502 when claude CLI cold-starts >30s — needs a retry, not yet filed

## Do not forget
- Screen recording is running in Block 2 — do not close the terminal window
```

Distinct from `docs/decision-log.md`: the log is **append-only narrative** (what we decided and why — video fodder); `STATE.md` is a **current snapshot** (where we are — resume fodder). Don't merge them.

### `/checkpoint` and `/resume-capstone`

Two project commands in `.claude/commands/`:

- **`/checkpoint`** — rewrites `STATE.md` from live signals (`git status` across all worktrees, `gh issue list`, `gh pr list`, `gh run list`), appends any new decisions to `decision-log.md`, commits both. Run at every phase boundary, before any risky operation, and any time you're about to step away.
- **`/resume-capstone`** — reads `docs/constitution.md`, `docs/STATE.md`, the active spec, and live `gh`/`git` state, then states back where things stand and what's next before touching anything. This is the first thing you type in any new session.

### GitHub is the real durable state

Issue status, PR status, CI results, and Project board columns survive everything and are machine-readable via `gh`. `STATE.md` can drift; GitHub can't. So `/resume-capstone` reconciles the two and **reports any disagreement rather than trusting the file** — a stale `STATE.md` that quietly contradicts reality is worse than none.

This is also why the SDD chain pays off twice: a half-finished task is recoverable because the spec still says what "done" means. You resume from an artifact, not from memory.

### Working rules

- **Never end a phase with uncommitted work.** WIP commits on a branch are fine and expected (`wip(SPEC-001): AC-1.4 test written, impl pending`). Uncommitted work is the only truly unrecoverable state here.
- Each agent's definition instructs it to update `STATE.md` on completion or when it hands back — captured while it's true, not reconstructed later.
- Long-lived facts about *how you work* (not project state) go to the Claude Code memory directory, so they survive the project itself.
- If a worktree is abandoned, record that in `STATE.md` before removing it.

---

## Key architectural decision: the inference sidecar

The Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`, v0.3.270) authenticates by spawning the `claude` CLI as a subprocess, which reads credentials from the macOS keychain. **Neither the binary nor the keychain exists inside a Docker container.** Options were: bake a key in (none available), or split the process boundary.

**Design:** a provider interface with three adapters, and inference lives on the host.

```
app (Next.js, containerized)
  └── LLM_PROVIDER = fixture | sidecar
        ├─ fixture  → fixtures/inference/*.json   (default in container + CI + video fallback)
        └─ sidecar  → http://host.docker.internal:8787/diagnose
                        └── services/inference-sidecar  (host Node process)
                              └── @anthropic-ai/claude-agent-sdk query()
                                    └── claude CLI → keychain → subscription auth
```

- `lib/inference/provider.ts` — single interface: `diagnoseStars(intake) → StarsDiagnosis`, `generatePlan(diagnosis) → Milestones[]`.
- `fixture.ts` — deterministic canned responses. **Used by all tests and CI.** Also the safe fallback if anything misbehaves on camera.
- `sidecar.ts` — HTTP client to the host service.
- `anthropic.ts` — a real `@anthropic-ai/sdk` adapter using `claude-opus-5`, written but unwired (activates on `ANTHROPIC_API_KEY`). Demonstrates portability; costs ~20 min.

The sidecar uses `query()` with `outputFormat: { type: "json_schema", schema }` so the STARS diagnosis returns validated JSON rather than prose to regex. Zod-validate the result at the boundary regardless.

This boundary is a genuine engineering finding and should be a named beat in the video, not hidden.

---

## Repository layout

```
CLAUDE.md                          # context engineering exhibit (Session 2)
.mcp.json                          # registers the MCP server for dev agents
.claude/
  agents/*.md                      # the crew (Session 5)
  skills/watkins-framework/SKILL.md
  skills/capstone-conventions/SKILL.md
  commands/{checkpoint,resume-capstone}.md
  settings.json
.github/
  ISSUE_TEMPLATE/{epic,user-story,bug,spike}.yml
  PULL_REQUEST_TEMPLATE.md
  CODEOWNERS
  workflows/{ci.yml,publish.yml}
docs/
  constitution.md                  # non-negotiable principles
  STATE.md                         # resume file — where we are right now
  adr/0001-*.md ...                # architecture decision records
  specs/{_TEMPLATE.md,SPEC-00N-*.md}
  plans/PLAN-00N-*.md
  tasks/TASKS-00N-*.md
  decision-log.md                  # running log of human-vs-agent decisions
  DEMO_SCRIPT.md
scripts/check-traceability.ts      # the hard gate
app/                               # Next.js 15 (App Router) + TypeScript + Tailwind
  lib/inference/{provider,fixture,sidecar,anthropic}.ts
  lib/stars/                       # domain logic
services/inference-sidecar/        # host-only Agent SDK service
mcp/onboarding-context/            # MCP server (Session 4)
fixtures/{synthetic-org.json,inference/*.json}
infra/terraform/                   # docker provider IaC (Session 7)
tests/{unit,e2e}/
prisma/schema.prisma
Dockerfile  docker-compose.yml
```

**Stack:** Next.js 15 + TypeScript + Tailwind + Prisma + Postgres 16 (one DB engine everywhere — compose locally, a GitHub Actions `services:` container in CI, a Terraform-provisioned container for the "deploy"). Vitest for unit, Playwright for e2e.

---

## The MCP server (Session 4)

`mcp/onboarding-context/` — a stdio MCP server on `@modelcontextprotocol/sdk`, backed entirely by `fixtures/synthetic-org.json` (AI-fabricated; the generation prompt is committed to `docs/specs/` as its own artifact).

Tools: `list_meetings(weekOffset)`, `search_people(query)`, `get_reporting_chain(personId)`
Resources: `org://directory`, `calendar://week/{n}`

**Used two ways — this is the strong demo beat:**
1. The app calls it to auto-populate the stakeholder map from "who you're actually meeting with."
2. It's registered in `.mcp.json`, so the dev-time Claude Code agents query the same server while building and testing against it.

Same server, both sides of the workflow. Show that on camera.

---

## The agent crew (Session 5)

Seven definitions in `.claude/agents/`. Dele is the orchestrator; these are the crew. Each gets an explicit scope, allowed tools, and a "stop and ask" boundary.

| Agent | Owns |
|---|---|
| `product-owner` | Watkins domain → epics/user stories → GitHub issues via `gh` |
| `architect` | ADRs, specs, interface contracts |
| `builder` | TDD implementation against a spec |
| `qa-engineer` | Vitest unit, Playwright e2e, a11y checks |
| `reviewer` | PR review against spec + conventions checklist |
| `platform-engineer` | Dockerfile, compose, Terraform, GH Actions, OTel |
| `demo-producer` | README, demo data, video script |

Install (interactive, Dele runs these — not scriptable):
```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### Superpowers as the enforced operating procedure

Superpowers is not an install checkbox — it is *how work is allowed to happen* in this repo. Each SDD phase is bound to a specific superpowers skill, and the binding is written into `CLAUDE.md` and into each agent definition so agents invoke them rather than improvising.

| SDD phase | Superpowers skill | Enforced by |
|---|---|---|
| Discovery → `SPEC-00N` | `brainstorming` | `product-owner`/`architect` must run `/brainstorm` before a spec exists; no spec written from a cold prompt |
| `SPEC` → `PLAN-00N` | `writing-plans` | `architect` agent definition mandates it; plan must name the ACs it covers |
| `PLAN` → `TASKS` → branches | `executing-plans` | `builder` works a task list, not a freeform prompt |
| Implementation | `test-driven-development` | `builder` writes the AC-named test first — this is what makes `check-traceability.ts` pass by construction rather than by retrofit |
| Parallel work | `using-git-worktrees` + `dispatching-parallel-agents` | Block 2 orchestration |
| Before any PR | `verification-before-completion` | `builder`/`qa-engineer` must self-verify against the spec's ACs before handing off |
| PR review | `requesting-code-review` / `receiving-code-review` | `builder` requests, `reviewer` performs, against the spec |
| Bugs | `systematic-debugging` | `qa-engineer` — no speculative fixes |
| Branch close-out | `finishing-a-development-branch` | clean merges, no orphan worktrees |

**Make the binding explicit, not implicit.** In `CLAUDE.md`, state the rule plainly: *"No implementation without a merged spec. No spec without brainstorming. No PR without verification-before-completion. No fix without systematic-debugging."* Then repeat the relevant line inside each agent's own definition file — agents follow their own prompt far more reliably than they follow a shared document. That duplication is deliberate context engineering (Session 2), and it's worth one sentence in the video.

**Where superpowers and the hand-rolled SDD chain meet:** superpowers owns the *verb* (how to brainstorm, how to plan, how to TDD); our `docs/` templates own the *noun* (what a spec, plan, and task file must contain, and the traceability table). No overlap, no ambiguity about which wins.

**The showpiece:** three git worktrees, three agents in parallel (app slice / MCP server / platform), three PRs into `main` through the required-checks gate. That's a 20-second visual that communicates "multi-agent orchestration" better than any slide.

---

## GitHub practices (the exhibit)

- **Public repo** ✓ — enables branch protection on free tier and gives the cohort a shareable link.
- Issue templates: Epic, **Spec** (opens the SDD chain), User Story/Task (requires a `Satisfies: AC-N.M` field), Bug, Spike.
- Labels beyond defaults: `epic`, `spec:SPEC-001..003`, `task`, `spike`, `agent:builder`, `agent:qa`, `agent:platform`, `session-N` (traces each artifact to a roadmap session).
- Milestones: `SPEC-001 — STARS`, `SPEC-002 — Plan`, `SPEC-003 — Stakeholders`, `Backlog — Post-Capstone`.
- GitHub Project (v2) board, issues auto-added.
- Conventional Commits with spec scope: `feat(SPEC-001): classify intake narrative`. Every commit references an issue; every PR carries `Implements: SPEC-00N (AC-1.1, AC-1.3)`.
- Branch protection on `main`: require PR, require status checks (`lint`, `typecheck`, `unit`, `e2e`, `build`, **`traceability`**), no direct pushes.
- `CODEOWNERS` + PR template with the `Implements:` line and a verification-before-completion checkbox.
- `docs/decision-log.md`: every place Dele overrode or redirected an agent. **This is the single highest-value artifact for the "how did you leverage AI" and "gotchas" sections of the video** — capture it *as you go*, not retroactively.

---

## Platform engineering (Session 7)

- **`Dockerfile`** — multi-stage, non-root, Next.js `output: "standalone"`.
- **`docker-compose.yml`** — app + postgres + otel-collector. `extra_hosts: host.docker.internal` for the sidecar.
- **`infra/terraform/`** — `kreuzwerker/docker` provider: `docker_network`, `docker_image` (pulled from GHCR), `docker_container` × 2, with variables and outputs. `terraform apply` stands up the stack. Real IaC against a real provider, no cloud account required. Requires `brew install terraform`.
- **CI (`ci.yml`)** — lint → typecheck → **traceability** → unit → build → e2e (Playwright, `LLM_PROVIDER=fixture`, postgres service container). All six required on `main`.
- **`publish.yml`** — build + push `ghcr.io/dolowoyo/aibootcamp-capstone` on tag, Trivy scan.
- **Observability** — `pino` structured JSON logs with request IDs, OpenTelemetry traces on the inference path (latency per diagnosis is a real metric worth showing), `/api/healthz` and `/api/readyz`.

---

## Schedule

Times are budgets, not estimates. The cut line matters more than the plan.

**Block 0 — Foundation (tonight, 2 hrs)**
Install superpowers. Scaffold repo, `CLAUDE.md` (including the enforced-procedure rules), `docs/constitution.md`, spec/plan/task templates, 7 agent definitions each citing their bound superpowers skill, 2 project skills, issue/PR templates, labels, milestones, Project board. Write `scripts/check-traceability.ts` and the `ci.yml` skeleton **now** — the gate must exist before the first spec, or it becomes a retrofit. Write `docs/STATE.md` + the `/checkpoint` and `/resume-capstone` commands, and **test the resume path before leaving Block 0** (verification step A below). First commit + push. Start `decision-log.md` immediately.

**Block 1 — Specs (tomorrow AM, 2.5 hrs)**
`/brainstorm` with `product-owner` → the Watkins epic breakdown filed as GitHub issues (the full book, so the backlog shows discovery scope). Then `architect` runs the chain for real: `SPEC-000` (provider contract) → `SPEC-001/002/003`, each with numbered ACs and a traceability table, merged via their own PRs. `PLAN-001..003` via `writing-plans`. `TASKS-*` → GitHub issues. ADR-0001 (inference boundary), ADR-0002 (fixture-first testing), ADR-0003 (local IaC).

*This block is the one most likely to overrun. If specs aren't merged by the 2.5-hour mark, cut `SPEC-003` (stakeholder map) to backlog and ship two slices well rather than three badly.*

**Block 2 — Parallel build (3.5 hrs) ← the showpiece**
Three worktrees, three agents, three PRs — each working a `TASKS-*` list under `executing-plans` + `test-driven-development`:
- W1 `builder` + `qa-engineer`: app slice (intake → diagnosis → plan → stakeholder map) + fixture provider + AC-named tests
- W2 `builder`: MCP server + synthetic org fixtures + sidecar service
- W3 `platform-engineer`: Dockerfile, compose, CI, Terraform, OTel

Each agent runs `verification-before-completion` before opening its PR; `reviewer` reviews against the spec before merge. **Record screen capture during this block** — this is the b-roll you cannot recreate afterward.

**Block 3 — Integration (1.5 hrs)**
Merge all three. Wire sidecar → app. End-to-end run with real Agent SDK inference. Seed demo persona. Fix what integration breaks.

**Block 4 — Video (2 hrs) — START THIS ON TIME**
Script from `docs/DEMO_SCRIPT.md`, record, edit, export.

**The cut line:** if Block 3 has not started by **3 hours before you intend to record**, drop Terraform and OTel to filed issues and ship Docker + CI only. An unrecorded video is a zero; a missing IaC module is a talking point. This is stated explicitly because over-commitment is the known failure mode here, and 1.5 days for eight sessions' worth of scope is genuinely tight.

---

## Video structure (5:00)

| Time | Beat |
|---|---|
| 0:00–0:45 | **Overview.** The problem (90 days decides whether a hire succeeds; most people wing it). Live app: intake → STARS diagnosis → 30/60/90 plan → stakeholder map. |
| 0:45–2:15 | **How I leveraged AI.** The SDD chain on screen (constitution → spec → plan → tasks → issues → tests → PR), the crew in `.claude/agents/` with their bound superpowers skills, three parallel worktrees → three PRs, the MCP server serving *both* the app and the dev agents. |
| 2:15–3:00 | **Platform + the gate.** `terraform apply` bringing the stack up, CI green, then **delete one row from a spec's traceability table and watch CI go red.** Ten seconds, and it proves the method wasn't decorative. |
| 3:00–4:15 | **Learnings + gotchas.** The Agent-SDK-can't-run-in-a-container auth wall and the sidecar boundary that resolved it. Fixture-first inference making an LLM app deterministically testable. Specs with numbered ACs as the actual mechanism for keeping seven agents from drifting. **Treating conversation context as a cache and the repo as the database** — `/checkpoint` + `STATE.md`, and what it was like to resume cold. Where agents drifted anyway and what in `CLAUDE.md` fixed it — read straight from `decision-log.md`. |
| 4:15–5:00 | **What I'd do differently.** Build the traceability gate before the first spec, not alongside it. Narrower first slice. Context engineering is the real force multiplier — duplicating rules into each agent's own definition worked far better than relying on a shared `CLAUDE.md`. |

Record with QuickTime (screen + mic). Have the app running in `fixture` mode in a second window as a live fallback so nothing can fail on camera.

---

## Verification

A. **Resume drill — do this at the end of Block 0, not later.** Run `/checkpoint`, then `/clear`, then `/resume-capstone` in a fresh session. It must correctly state the current block, in-flight work, and next actions with no prompting from you. If it can't, fix it now — discovering this at hour 10 is the expensive version. Repeat the drill once more at the end of Block 2, when there's real multi-worktree state to reconstruct.
B. Introduce a deliberate mismatch (mark an issue closed in GitHub that `STATE.md` still lists as in progress) and confirm `/resume-capstone` *reports the disagreement* rather than silently trusting the file.

0. `npx tsx scripts/check-traceability.ts` — exits 0 with every AC mapped. Then delete one traceability row and confirm it exits non-zero with a useful message. **Verify the gate before trusting it.**
1. `npm run lint && npm run typecheck && npm run test` — green locally.
2. `npx playwright test` against `LLM_PROVIDER=fixture` — full intake → diagnosis → plan → stakeholder-map journey passes deterministically.
3. `npx @modelcontextprotocol/inspector node mcp/onboarding-context/dist/index.js` — tools list and return fabricated org data.
4. In a Claude Code session, confirm an agent can call the MCP server via `.mcp.json`.
5. `node services/inference-sidecar/index.js` on the host, then `LLM_PROVIDER=sidecar` — a real STARS diagnosis returns from the Agent SDK on subscription auth, schema-validated.
6. `docker compose up --build` — app reachable at `localhost:3000`, `/api/healthz` and `/api/readyz` return 200.
7. `cd infra/terraform && terraform init && terraform apply` — network + postgres + app containers provisioned; `terraform destroy` tears them down cleanly.
8. Open a PR from a scratch branch — CI runs, all six checks required, merge blocked until green.
9. `gh issue list` and `gh pr list` show the full traced trail: spec → plan → task issue → branch → AC-named test → PR → review → merge. Pick one AC at random and walk it end to end; if you can't, the trail has a hole.

---

## Open items for Dele

- ✓ Repo is public. Still worth a skim of the README before the cohort link goes out — all data is fabricated, just confirm no Slalom-internal framing.
- ✓ Terraform installed (not yet on this session's PATH; re-verify in a fresh shell at Block 3).
- Run the two `/plugin` commands for superpowers before Block 0 begins.
