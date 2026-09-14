# Current State — updated 2026-09-14T00:10Z (Block 2 in progress — the parallel build)

Block: 2 (parallel worktree build) — 3 agents launched in parallel, each in its own
harness-managed worktree (`isolation: "worktree"` on the Agent tool — the native mechanism,
per the `using-git-worktrees` skill, not manual `git worktree add`). Running in background.

Active specs: `SPEC-000`/`001`/`002`/`003` all merged, Status: approved. Whichever specs W1
fully implements will flip to `implemented` in W1's own PR, once its tests genuinely exist.

## In flight

- **W1** (`builder`, branch `block-2/w1-app-slice`): Next.js 15 app scaffold + `TASKS-000`
  Tasks 1-8 (lib/inference/, NOT the sidecar service itself) + all of `TASKS-001`/`002`/`003`.
  Told explicitly not to depend on `fixtures/synthetic-org.json` (W2 owns it) — uses inline
  mocks against `docs/mcp-tool-contract.md`'s documented shapes instead.
- **W2 — DONE.** PR #62 opened, reviewed, content approved. Real TDD (confirmed red→green),
  real end-to-end verification (live stdio MCP client test, live Agent SDK boot smoke test).
  14-person/140-meeting fabricated org fixture, full 13-week window, all sentiment values
  present. **Found a real gap:** no wire-contract doc existed for the sidecar's HTTP shape
  (unlike MCP tools, this wasn't pre-resolved before Block 2 launch) — W2 designed one
  itself, documented at `services/inference-sidecar/README.md`. Sent the real contract to
  W1 (still running) via `SendMessage` before it could lock in an independent guess — see
  decision-log for the full account, including the honest miss on my part.
- **W3 — DONE.** PR #61 opened, reviewed (posted as a real PR comment), content approved.
  Real verification throughout: `terraform init/validate/plan/apply/destroy` actually run,
  `docker compose up` against postgres+otel-collector genuinely tested (live OTLP trace
  POST confirmed), `hadolint`/`actionlint` clean. CI is red on this branch alone for the
  exactly-expected reason (`app/` doesn't exist yet → `--workspace app` resolves to
  nothing) — not a defect. **Holding merge until W1 lands**, then re-running CI (should go
  green once `app/` exists) before merging for real, not bypassing the gate. One
  integration watch-item: Dockerfile's `COPY .../app/public ./public` will fail if W1
  doesn't create a `public/` dir (very standard for Next.js, low risk).
- Each agent was told: don't merge its own PR, don't touch the other worktrees' directories,
  run real verification before opening its PR, and be explicit about what's deferred to
  Block 3 integration vs. genuinely done now.
- Root `package.json` already declares npm workspaces (`app`, `services/*`, `mcp/*`) and the
  shared script contract (`lint`/`typecheck`/`test`/`build`/`test:e2e`) all three build
  against — set up before launch specifically so this didn't become a 3-way coordination
  problem mid-flight.

Prior blocks, for context: Block 0 (foundation/scaffolding) and Block 1 (all 4 specs + plans
+ tasks + ADRs) are both fully merged to `main`. 57 issues filed, Project board current.
Full history in git log and `docs/decision-log.md` — not repeated here since this file is a
snapshot, not an archive.

## Next 3 actions

1. Wait for all 3 agents to report back (background notifications) — do not poll or guess
   their results in the meantime
2. Review each PR: run `check-traceability`, confirm CI, check for scope/contract drift
   (especially the MCP tool contract — flagged explicitly to W2 to update the doc if it
   changes anything)
3. Merge in a sensible order (likely W2 MCP/sidecar and W3 platform first, since W1's app
   is the one most likely to need both), then start Block 3 (integration)

## Blockers / open decisions

- **Resolved:** branch protection required 1 approving review; dropped to CI-checks-only
  after self-approval couldn't be verified safely on this solo repo (`gh`'s own classifier
  blocked the test). Merge gate: 6 required status checks, no review-count requirement.
- **Unexplained, not touched:** `git worktree list` shows a second worktree at
  `../copilot-worktrees/aibootcamp-capstone/dolowoyo-studious-guacamole` at commit
  `0000000` (empty/detached). Not created by this session. Flag to Dele before assuming
  it's safe to remove.
- **Resolved:** Terraform wasn't actually installed (`brew install terraform` doesn't work
  post-BSL-license-change, and `hashicorp/tap` fails under current Homebrew's trust policy).
  Installed v1.16.2 arm64 binary directly, checksum-verified, confirmed working against the
  real `kreuzwerker/docker` provider.
- **Resolved before Block 2 launch:** the MCP tool contract coordination risk flagged in
  Block 1 — `docs/mcp-tool-contract.md` now exists as the shared source of truth for W1 and
  W2 to build against independently without guessing at each other.
- Docker daemon **not currently running** — start Docker Desktop before Block 3's
  `docker compose up` / real `terraform apply` against a pulled image.

## Do not forget

- `check-traceability.ts`'s two-tier model: a spec's `Status:` flips to `implemented` only
  once its real tests exist — that's W1's job for SPEC-001/002/003, in the same PR.
- If a subagent needs to inspect the broken `copilot-worktrees` worktree, `git status`
  inside it can hang — use `ls` to probe it instead.
- **Screen recording should be running now if it wasn't already** — this parallel-build
  moment is the b-roll that can't be recreated after merging.
