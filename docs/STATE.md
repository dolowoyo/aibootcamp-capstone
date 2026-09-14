# Current State — updated 2026-09-14T02:40Z

Block: 3 (integration) — **in progress.** `/api/readyz` merged (PR #64). Sidecar wiring
fixes complete, verified live, and open as PR #65 — CI green, **not yet merged** (see
Blockers).

Active specs: `SPEC-000`/`001`/`002`/`003` all merged, `Status: implemented`. PR #65 is a
bug-fix PR against SPEC-000's already-implemented sidecar adapter, not new scope.

## In flight

- Main worktree on branch `block-3/sidecar-live-wiring` at `0efedc2`, pushed to origin. PR
  #65 open: `fix(SPEC-000): wire sidecar adapter for real end-to-end Agent SDK inference`.
  All 6 required checks (`lint`, `typecheck`, `traceability`, `unit`, `build`, `e2e`)
  genuinely green.
- PR #65 fixes three real bugs found via live testing (not just mocked-boundary unit
  tests) against a real `claude-agent-sdk` process: (1) `zodToJsonSchema(schema, "Name")`'s
  `$ref`/`definitions` wrapper rejected by the Anthropic API; (2) `generatePlan`'s array
  return type rejected by the same tool-use `input_schema` constraint, fixed by wrapping as
  `{ milestones: [...] }`; (3) a client/server timeout race (both were 30s with no margin),
  split into per-operation budgets — `/diagnose` 30s server/40s client, `/plan` 60s
  server/70s client (raised specifically because live testing showed plan generation
  consistently exceeded a shared 30s ceiling; confirmed with Dele before changing it).
- Verified live end-to-end via real browser interaction (not curl, not mocks): a real STARS
  diagnosis and a real 30/60/90 plan both round-tripped through the sidecar to a live Agent
  SDK call (subscription auth via the bundled SDK executable, not a PATH-installed `claude`
  CLI — see Do not forget) and rendered correctly in the app.
- No other active worktrees. The stray `copilot-worktrees/.../dolowoyo-studious-guacamole`
  worktree at `0000000` is still present, still unexplained, still not touched.

## Next 3 actions

1. **Merge PR #65** (blocked — see below), then continue Block 3: `docker compose up
   --build` including the app container, and `cd infra/terraform && terraform apply` for
   the real IaC stack (per `docs/00-capstone-plan.md`'s verification checklist, items 5-6).
2. Seed a coherent demo persona (`fixtures/synthetic-org.json`-backed) for the video
   walkthrough.
3. Re-run the fixture-mode smoke check (`/`, `/diagnosis`, `/plan`, `/stakeholders`,
   `/api/healthz`, `/api/readyz`) once PR #65 is merged, since `lib/inference` changed.

## Blockers / open decisions

- **PR #65 cannot be merged by the agent session.** `gh pr merge 65 --merge` was denied by
  Claude Code's auto-mode safety classifier ("Merge Without Review") — the same class of
  guardrail that blocked self-approval during Block 1's branch-protection work. All 6
  required checks are green and the PR is `MERGEABLE`/`CLEAN`; it needs a human (Dele) to
  merge it, e.g. via the GitHub web UI or `gh pr merge 65 --merge` run outside this session's
  auto-mode restriction.
- **Block 2's screen capture was never recorded and can't be recreated** — logged in
  decision-log.md (2026-09-13). Block 3 (this session) is being recorded live.
- **Unexplained, not touched:** stray `copilot-worktrees/.../dolowoyo-studious-guacamole`
  worktree at commit `0000000`.
- `npm audit` still flags dev-toolchain vulnerabilities (vitest/vite/esbuild/prisma) — low
  priority, unresolved, whenever convenient.

## Do not forget

- **The `claude` CLI is not on `PATH` in this environment** — it only exists bundled inside
  the versioned VS Code extension directory
  (`~/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude`). This
  didn't block the sidecar: `@anthropic-ai/claude-agent-sdk-darwin-arm64` ships its own
  ~200MB bundled executable at `node_modules/@anthropic-ai/claude-agent-sdk-darwin-arm64/
  claude`, which is what `services/inference-sidecar` actually uses via the SDK's `query()`
  — confirmed working with real subscription auth. Worth remembering if a future session
  sees `which claude` fail and assumes the sidecar can't authenticate; it can.
- Recording is live (QuickTime, screen + mic) — Block 3 work should continue to be captured
  as real footage.
- `docs/DEMO_SCRIPT.md` does not exist yet — a Block 4 deliverable, written after Block 3
  wraps.
- Docker daemon (Colima): not re-verified this checkpoint; Block 3's Docker/Terraform step
  (Next action #1, second half) hasn't started yet.
