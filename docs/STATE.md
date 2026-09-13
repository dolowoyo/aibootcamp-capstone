# Current State — updated 2026-09-13T22:05Z (Block 1 in progress)

Block: 1 (specs) — discovery done, specs not started yet.

Active specs: none yet — SPEC-000/001/002/003 not started

## In flight

- `product-owner` completed: 24 GitHub issues filed (3 shipped epics #2-4, 1 infra task #5,
  12 stories #6-17, 8 backlog epics #18-25), all added to the Project board (#2-17 → Spec
  column, #18-25 → Backlog column)
- Two scope questions from product-owner resolved with Dele: backlog stays epic-level only
  (no story breakdown); SPEC-003 stays a static map, Coalition Action Planner (#23) is a
  separate backlog epic, not folded in — see decision-log
- No open PRs, no active feature worktrees yet — all Block 0/1 work has been direct on
  `main`, no worktree isolation needed (nothing parallel yet; worktrees start in Block 2)
- CI on `main`: green on every push so far

## Next 3 actions

1. Launch `architect` to draft `SPEC-000` (inference provider contract) — SPEC-001/002/003
   depend on its interface, so it goes first
2. `architect` drafts `SPEC-001`/`002`/`003` from issues #2-17, each with numbered ACs and
   traceability tables (tests don't exist yet — that's `builder`'s job in Block 2)
3. `architect` drafts `PLAN-001..003` (writing-plans skill), `TASKS-*`, and
   ADR-0002 (fixture-first testing) / ADR-0003 (local IaC)

## Blockers / open decisions

- **Resolved 2026-09-13:** branch protection originally required 1 approving PR review;
  dropped to CI-checks-only after self-approval couldn't be verified safely on this solo
  repo. See `docs/decision-log.md`. Merge gate is now: 6 required status checks
  (lint/typecheck/traceability/unit/build/e2e), no review-count requirement.
- **Unexplained:** `git worktree list` shows a second worktree at
  `../copilot-worktrees/aibootcamp-capstone/dolowoyo-studious-guacamole` at commit `0000000`
  (empty/detached). Not created by this session — likely leftover from another tool on this
  machine (name suggests GitHub Copilot workspace tooling). Not touched; flag to Dele before
  assuming it's safe to remove.
- **Resolved 2026-09-13:** Terraform was NOT actually installed — `brew install terraform`
  fails silently/errors because HashiCorp pulled `terraform` from homebrew-core years ago,
  and re-tapping `hashicorp/tap` fails under current Homebrew's trust policy (unrelated
  formulas in the same tap — `boundary`, `consul-*` — are rejected as untrusted, which kills
  the whole tap operation). Installed the official v1.16.2 arm64 binary directly from
  releases.hashicorp.com instead, with checksum verification, to `/opt/homebrew/bin`.
  Verified: `terraform version` → `Terraform v1.16.2 on darwin_arm64`, AND
  `terraform init` against a throwaway `kreuzwerker/docker` provider config succeeded —
  the actual provider Block 3's IaC will use. See decision-log.
- Docker daemon is **not currently running** (checked via `docker info`) — not a blocker
  now, but start Docker Desktop before Block 3's `terraform apply` / `docker compose up`.

## Do not forget

- `check-traceability.ts` was already proven end-to-end (pass → induced failure → clean pass)
  before being trusted as the CI gate — see commit `d98e65e`'s message.
- If a subagent needs to inspect the broken `copilot-worktrees` worktree, `git status` inside
  it can hang — use `ls` to probe it instead, don't run git commands against it blind.
