# Current State — updated 2026-09-14T00:35Z (Block 2 COMPLETE)

Block: 2 (parallel worktree build) — **complete.** All 3 PRs merged, CI genuinely green on
`main`, all worktrees and stale branches cleaned up. Ready for Block 3 (integration).

Active specs: `SPEC-000`/`001`/`002`/`003` all merged, all now `Status: implemented`
(flipped by W1 once real tests existed) — Tier 2 traceability genuinely passing for all four.

## In flight

- **W1 (app slice) — merged, PR #63.** Next.js 15 app + full `lib/inference/` (minus the
  sidecar service) + `lib/stars/` + `lib/plan/` + `lib/stakeholders/`. 39 tests. Correctly
  applied a mid-flight sidecar-contract correction relayed from W2.
- **W2 (MCP server + sidecar) — merged, PR #62.** `mcp/onboarding-context/` (13 tests),
  `services/inference-sidecar/` (13 tests), `fixtures/synthetic-org.json` + generation
  prompt. Designed the sidecar's HTTP wire contract itself (no doc existed) and documented
  it — this became the one W1 was corrected against.
- **W3 (platform) — merged, PR #61.** Dockerfile, docker-compose.yml, Terraform
  (`kreuzwerker/docker`), real CI wiring, `publish.yml`, `docs/observability.md`.
- **Merge order:** W1 → W3 → W2, each verified with real commands (not trusted CI badges
  blindly) before merging. `main`'s CI is genuinely green — confirmed independently across
  all four workspaces (app/lib: 39 tests, mcp: 13, sidecar: 13 — 65 total, all real).

## Real findings from this block (full detail in decision-log.md)

- **Two bugs in the traceability gate's own design**, caught before the first spec merged:
  a backtick-parsing bug, and the two-tier enforcement model (specs merge before their tests
  exist; `Status: implemented` activates strict test-resolution per spec).
- **None of the 7 agent definitions had the `Skill` tool granted** — fixed before Block 2
  launched. (One open thread: W1 still reported `Skill` unavailable at runtime despite the
  frontmatter fix — the written instructions were followed faithfully regardless, but the
  literal tool-grant mechanism is worth investigating further, not fully diagnosed.)
- **`.claude/worktrees/` was never gitignored** before first real worktree use — caught and
  fixed; nothing was ever committed.
- **A sidecar HTTP wire-contract gap** — pre-resolved the MCP tool contract before launch,
  missed doing the same for the sidecar. W2 designed one under real pressure; relayed to W1
  mid-flight via `SendMessage` before it could diverge independently.
- **PR #63's green CI checks were misleading** — its branch predated W3's real CI wiring,
  so it ran stale placeholder `echo` steps. Verified manually instead of trusting the badge.
- **Two real container integration bugs**, found by actually building and running the
  container before merging W3: `next.config.ts` never set `output: "standalone"` despite a
  comment claiming it did; the Dockerfile assumed a per-workspace `app/node_modules` that npm
  hoisting never creates, and assumed a flat `server.js` path that the monorepo's
  `outputFileTracingRoot` actually nests under `app/`.
- **A cross-worktree zod version conflict** (app wanted v3, MCP server independently chose
  v4) — invisible until both workspaces' dependencies were combined in one install. Aligned
  to v3 (already proven, no code changes needed).
- **The Project board was only updated in batch, after work landed**, not live as it
  happened — Dele flagged this. Added a concrete board-sync rule (with real project/field/
  option IDs) to `capstone-conventions`, wired into every implementation-facing agent's
  working rules, and added as a `/checkpoint` safety-net step.

## Next 3 actions

1. Start Block 3 (integration): wire the sidecar → app end-to-end with real Agent SDK
   inference; add the missing `/api/readyz` route (compose references it, only `healthz`
   exists); seed a coherent demo persona
2. Run the full verification checklist from `docs/00-capstone-plan.md` — `terraform apply`
   the real stack, `docker compose up` end-to-end including the app container
3. Address the dev-dependency vulnerabilities `npm audit` flagged (vitest/vite/esbuild/
   prisma toolchain, not runtime deps) — low priority, `npm audit fix` pass

## Blockers / open decisions

- **Unexplained, not touched:** stray `copilot-worktrees/.../dolowoyo-studious-guacamole`
  worktree at commit `0000000` — still present, still ignored, not created by this session.
- Docker daemon: **running** (Colima) as of this checkpoint — used for real verification
  during Block 2's merge sequence. Confirm still running at the start of Block 3.
- Terraform v1.16.2 confirmed working at `/opt/homebrew/bin/terraform`.
- **Open, not fully diagnosed:** why W1 reported the `Skill` tool unavailable despite the
  frontmatter grant. Worth investigating before Block 3 if there's time, since Block 3 will
  also run agents expected to invoke bound skills.

## Do not forget

- `check-traceability.ts`'s two-tier model: all 4 specs are now `implemented` — any future
  PR that breaks a traceability row or deletes a test will now fail CI for real, on any spec.
- The Project board sync rule is now a documented working rule, not tribal knowledge — see
  `capstone-conventions`'s board-sync section for the exact commands/IDs before any future
  agent work that touches issues.
- 65 real tests pass across 4 workspaces, verified independently by the orchestrator, not
  just claimed by the agents that wrote them.
