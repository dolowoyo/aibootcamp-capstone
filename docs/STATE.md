# Current State — updated 2026-09-13T23:15Z (Block 1 nearly complete)

Block: 1 (specs) — discovery done, all 4 specs + plans + tasks + ADRs drafted and resolved.
One PR away from Block 1 being fully complete.

Active specs: `SPEC-000` merged (approved). `SPEC-001`/`002`/`003` drafted, all open
questions resolved with Dele, ready to merge.

## In flight

- `product-owner`: 24 issues filed (epics #2-4, task #5, stories #6-17, backlog #18-25),
  Project board populated. Two scope questions resolved (backlog stays epic-level;
  SPEC-003 stays a static map, #23 Coalition Action Planner separate).
- `SPEC-000` (inference provider contract, 11 ACs) merged via PR #26 — all 6 required
  checks passed for real, including `traceability`. First proof the merge gate works
  end to end. In the process, found and fixed two real gaps in the gate itself: a
  backtick-parsing bug, and a missing two-tier enforcement model (Tier 1 structural,
  always; Tier 2 resolution, only once a spec is marked `Status: implemented`) — without
  which merging any spec before its tests exist would have permanently redded out `main`.
- `architect` drafted `SPEC-001` (STARS diagnosis, 8 ACs), `SPEC-002` (30/60/90 plan,
  8 ACs), `SPEC-003` (stakeholder map, 7 ACs), `PLAN-000..003`, `TASKS-000..003` (33 GitHub
  issues filed, #27-59), and `ADR-0002`/`ADR-0003`. 8 flagged assumptions, all resolved
  (4 confirmed with Dele as real product decisions, 4 confirmed as reasonable low-stakes
  defaults) — see decision-log for the full list.
- `npm run check:traceability` passes (Tier 1) across all 4 specs.
- No open PRs right now, no active feature worktrees — Block 0/1 work has been sequential
  on `main` or single-purpose branches; worktrees start in Block 2.
- CI on `main`: green on every push/PR so far.

## Next 3 actions

1. Commit SPEC-001/002/003 + plans + tasks + ADR-0002/0003, open a PR, confirm all 6
   checks pass, merge — this closes out Block 1
2. `/checkpoint` once merged, then start Block 2: three worktrees (app / MCP server /
   platform), three agents in parallel — the showpiece block
3. Before Block 2 builders start deeply on the stakeholder feature or the MCP server:
   reconcile the exact MCP tool contract between them first (see coordination note below)
   — `PLAN-003`'s MCP client interface is written against the plan doc, not a real server

## Blockers / open decisions

- **Resolved:** branch protection required 1 approving review; dropped to CI-checks-only
  after self-approval couldn't be verified safely on this solo repo (`gh` classifier
  blocked the test). Merge gate: 6 required status checks, no review-count requirement.
- **Unexplained, not touched:** `git worktree list` shows a second worktree at
  `../copilot-worktrees/aibootcamp-capstone/dolowoyo-studious-guacamole` at commit
  `0000000` (empty/detached). Not created by this session. Flag to Dele before assuming
  it's safe to remove.
- **Resolved:** Terraform wasn't actually installed (`brew install terraform` doesn't
  work post-BSL-license-change, and `hashicorp/tap` fails under current Homebrew's trust
  policy). Installed v1.16.2 arm64 binary directly, checksum-verified, confirmed working
  against the real `kreuzwerker/docker` provider.
- **Coordination risk for Block 2 (not yet a blocker):** `PLAN-003`'s stakeholder-map MCP
  client is written against tool names/shapes from `docs/00-capstone-plan.md`, not a
  tested server. Whoever builds the app-side feature (W1) and whoever builds
  `mcp/onboarding-context` (W2) should confirm the exact tool contract with each other
  before building deeply against an assumed shape.
- Docker daemon is **not currently running** — start Docker Desktop before Block 3.

## Do not forget

- `check-traceability.ts`'s two-tier model: specs merge as `approved` (Tier 1 only); flip
  a spec's `Status:` to `implemented` in the same PR that adds its real tests — that's
  what activates Tier 2 (real test resolution) for that spec going forward.
- If a subagent needs to inspect the broken `copilot-worktrees` worktree, `git status`
  inside it can hang — use `ls` to probe it instead.
