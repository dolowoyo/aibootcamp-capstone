# Current State — updated 2026-09-14T01:55Z

Block: 3 (integration) — **started.** Block 2 fully merged and verified (see prior
checkpoint). First real Block 3 task shipped: `/api/readyz`, merged as PR #64.

Active specs: `SPEC-000`/`001`/`002`/`003` all merged, `Status: implemented`. `/api/readyz`
falls under platform-engineering scope (no `SPEC-00N` applies), per the same precedent PR #61
set for infra/observability work.

## In flight

- No active worktrees, no open PRs. Working tree clean on `main` at `e69ae7d`.
- App verified running locally in `LLM_PROVIDER=fixture` mode: `/`, `/diagnosis` (full
  intake → fixture diagnosis round trip, confirmed via browser), `/plan`, `/stakeholders`,
  `/api/healthz` all confirmed 200. No Postgres/Prisma runtime dependency exists yet outside
  the new readyz route.
- PR #64 (`feat(platform): add /api/readyz readiness check`) — merged, all 6 required
  checks genuinely green (`d3a83b9`). Confirms real Postgres liveness via `SELECT 1`,
  mocked at the Prisma boundary in its unit test (no live DB required for tests). Does not
  check the sidecar, so fixture-mode demos stay "ready" with no sidecar running.

## Next 3 actions

1. Wire the inference sidecar → app end-to-end with real Agent SDK inference
   (`services/inference-sidecar/`, `LLM_PROVIDER=sidecar`) — the core remaining Block 3
   integration item.
2. Seed a coherent demo persona (fixtures/synthetic-org.json-backed) for the video walkthrough.
3. Run the fuller verification checklist from `docs/00-capstone-plan.md`: `docker compose up
   --build` including the app container (now that `/api/readyz` exists), and
   `cd infra/terraform && terraform apply` for the real IaC stack.

## Blockers / open decisions

- **Block 2's screen capture was never recorded and can't be recreated** — logged in
  decision-log.md (2026-09-13). Mitigation in progress: Dele is now recording live from
  Block 3 onward; the `/api/readyz` task above was done as the first piece of real,
  camera-ready re-enactment b-roll rather than staged footage.
- **Unexplained, not touched:** stray `copilot-worktrees/.../dolowoyo-studious-guacamole`
  worktree at commit `0000000` — still present, still ignored, not created by this project's
  sessions.
- `npm audit` still flags dev-toolchain vulnerabilities (vitest/vite/esbuild/prisma) — low
  priority, unresolved, whenever convenient.

## Do not forget

- **Recording is live (QuickTime, screen + mic)** as of this checkpoint — Block 3 work
  should continue to be captured as real footage, not narrated after the fact.
- `docs/DEMO_SCRIPT.md` does not exist yet — it's a Block 4 deliverable, written only after
  Block 3 wraps. Nothing to script or read during Block 3 sessions.
- Docker daemon: was running (Colima) as of the last Block 2 checkpoint; not re-verified this
  checkpoint since Block 3's DB/Docker work hasn't started yet.
