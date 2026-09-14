# Current State — updated 2026-09-14T13:10Z

Block: 3 (integration) — **in progress.** `/api/readyz` merged (PR #64). Sidecar wiring
fixes merged (PR #65, squash-merged as `cc66da4`) — real Agent SDK inference now verified
working end-to-end.

Active specs: `SPEC-000`/`001`/`002`/`003` all merged, `Status: implemented`. PR #65 was a
bug-fix PR against SPEC-000's already-implemented sidecar adapter, not new scope.

## In flight

- No active worktrees, no open PRs. Working tree clean on `main` at `cc66da4`. Branch
  `block-3/sidecar-live-wiring` merged and deleted (local + remote).
- PR #65 fixed three real bugs found via live testing (not just mocked-boundary unit tests)
  against a real `claude-agent-sdk` process: (1) `zodToJsonSchema(schema, "Name")`'s
  `$ref`/`definitions` wrapper rejected by the Anthropic API; (2) `generatePlan`'s array
  return type rejected by the same tool-use `input_schema` constraint, fixed by wrapping as
  `{ milestones: [...] }`; (3) a client/server timeout race (both were 30s with no margin),
  split into per-operation budgets — `/diagnose` 30s server/40s client, `/plan` 60s
  server/70s client (raised specifically because live testing showed plan generation
  consistently exceeded a shared 30s ceiling; confirmed with Dele before changing it).
- Verified live end-to-end via real browser interaction (not curl, not mocks): a real STARS
  diagnosis and a real 30/60/90 plan both round-tripped through the sidecar to a live Agent
  SDK call (subscription auth via the bundled SDK executable, not a PATH-installed `claude`
  CLI — see Do not forget) and rendered correctly in the app. Both dev processes (sidecar,
  app) stopped cleanly after verification — nothing left running.
- The stray `copilot-worktrees/.../dolowoyo-studious-guacamole` worktree at `0000000` is
  still present, still unexplained, still not touched.

## Next 3 actions

1. Run the fuller verification checklist from `docs/00-capstone-plan.md`: `docker compose up
   --build` including the app container, and `cd infra/terraform && terraform apply` for
   the real IaC stack (items 5-6). `lib/inference` changed in PR #65, so re-confirm the
   fixture-mode smoke check (`/`, `/diagnosis`, `/plan`, `/stakeholders`, `/api/healthz`,
   `/api/readyz`) still holds as part of this.
2. Seed a coherent demo persona (`fixtures/synthetic-org.json`-backed) for the video
   walkthrough.
3. Consider whether `generatePlan`'s now-70s client timeout needs a demo-side loading state
   (the live UI currently shows no progress indicator during the ~15-32s real-inference
   wait) — not blocking, but worth a look before recording the sidecar demo segment.

## Blockers / open decisions

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
- **This session's agent could not merge its own PR** — `gh pr merge` was denied by Claude
  Code's auto-mode safety classifier ("Merge Without Review"), the same class of guardrail
  that blocked self-approval during Block 1's branch-protection work. Dele merged PR #65
  manually. Expect this for every future PR in this project unless auto-mode settings change.
- Recording is live (QuickTime, screen + mic) — Block 3 work should continue to be captured
  as real footage.
- `docs/DEMO_SCRIPT.md` does not exist yet — a Block 4 deliverable, written after Block 3
  wraps.
- Docker daemon (Colima): not re-verified this checkpoint; Block 3's Docker/Terraform step
  (Next action #1) hasn't started yet.
