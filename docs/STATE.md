# Current State — updated 2026-09-15T13:35Z

Block: 3 (integration) — **complete.** Block 4 (video) starting now — Dele needs to record
today. `/api/readyz` (PR #64), sidecar live-wiring (PR #65), Docker/Prisma fixes (PR #66),
cross-route persistence (SPEC-004, PR #75), and a real, fully-verified Terraform apply
(PRs #76-79) are all merged.

Active specs: `SPEC-000`–`SPEC-004` all merged, `Status: implemented`.

## In flight

- No active worktrees, no open PRs. Working tree clean on `main` at `a54156a`.
- **Terraform verification — fully done, first time ever.** Publishing the app image for
  the first time (git tag `v0.1.0`) surfaced four independent bugs in a row in `publish.yml`
  (trivy-action tag typo → its own dead `setup-trivy` pin → real CRITICAL/HIGH CVEs
  found once Trivy could actually run → amd64-only build failing to pull on this Apple
  Silicon host), plus two bugs in `infra/terraform/main.tf` itself (`SIDECAR_URL` naming,
  no Prisma migration step — both already-known classes from `docker-compose.yml`). All
  fixed, each verified before moving to the next. Full detail: `docs/decision-log.md`'s
  2026-09-15 entry.
- `terraform apply` against the real published multi-arch image: **succeeded completely** —
  7 resources, real Postgres, real `prisma db push` via the new `docker_container.migrate`,
  real `healthz`/`readyz` 200s. Then `terraform destroy` cleanly — deliberately left at zero
  so the recorded demo's live `apply` is a genuine "from nothing" moment, not a no-op.
- Published image: `ghcr.io/dolowoyo/aibootcamp-capstone:0.1.0` (git tag `v0.1.0`), confirmed
  multi-arch (verified by pulling and inspecting on this arm64 host).
- **Demo persona (synthetic-org.json → real MCP wiring) — deliberately deferred, not
  started.** Dele had chosen "wire real MCP integration" over the cheaper manual-entry
  option, but that's new behavior needing its own spec/plan cycle — with recording starting
  today, this got cut per `docs/00-capstone-plan.md`'s own cut-line rule (an unrecorded
  video is a zero; an unwired MCP demo path is a talking point). The stakeholder map still
  works today via manual entry (SPEC-003's tested graceful-degradation path) — that's the
  honest state to demo, not a broken feature.
- The stray `copilot-worktrees/.../dolowoyo-studious-guacamole` worktree at `0000000` is
  still present, still unexplained, still not touched.

## Next 3 actions

1. **Write `docs/DEMO_SCRIPT.md`** per `docs/00-capstone-plan.md`'s 5-minute structure, then
   record. This is the priority right now — everything else in this file is context for
   that, not a blocker to it.
2. Record, edit, export (Block 4's full 2-hour budget).
3. After submission: real MCP wiring for the demo persona, and the sidecar's missing
   loading-indicator UX, both carried over as legitimate follow-ups — not needed for
   today's submission.

## Blockers / open decisions

- **Block 2's screen capture was never recorded and can't be recreated** — logged in
  decision-log.md (2026-09-13). Block 3 was recorded live.
- **Unexplained, not touched:** stray `copilot-worktrees/.../dolowoyo-studious-guacamole`
  worktree at commit `0000000`.
- `npm audit`'s remaining flags are dev-toolchain-only at this point (post today's CVE
  fixes to the actual shipped image) — low priority, unresolved, whenever convenient.
- Issue #74 (Terraform migration gap) — **closed by today's work**, the `docker_container
  .migrate` resource added to `main.tf` directly resolves it. Verify the issue got closed;
  if not, close it manually referencing this session's PRs.

## Do not forget

- **`docker/metadata-action`'s semver pattern strips the tag's leading `v`** — git tag
  `v0.1.0` publishes as image tag `0.1.0`, not `v0.1.0`. `terraform apply
  -var="image_tag=0.1.0"` (no `v`), not `v0.1.0` — the README used to say the wrong one.
- **The `node:20-alpine` runner image had npm/npx/corepack removed entirely** (they were
  never used at runtime, and their bundled tar/sigstore had real CVEs) — if a future change
  needs npm inside the runtime container for some reason, that decision needs revisiting,
  not just re-adding it back reflexively.
- **`package.json`'s `overrides` for a deeply-nested framework dependency (postcss inside
  next) needed a fully fresh `package-lock.json`** — deleting `node_modules` alone wasn't
  enough; a stale lockfile kept resolving the old nested version. If an override doesn't
  seem to take effect, delete the lockfile too, not just `node_modules`.
- **Merging a PR from within an agent session requires an explicit, in-the-moment
  instruction from Dele in the same turn** — confirmed again this session across 4 more
  PRs (#76-79), consistent with the pattern first seen with PR #65.
- **Terraform's `docker` provider needs `DOCKER_HOST` set explicitly on Colima** —
  `export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"` — the provider doesn't
  read `docker context` the way the `docker` CLI does. Already documented in
  `infra/terraform/README.md`, re-confirmed this session (the first apply attempt failed
  without it, even though plain `docker` commands worked fine in the same shell).
- Recording is live (QuickTime, screen + mic) — has been throughout Block 3, continuing
  into Block 4.
- `docs/DEMO_SCRIPT.md` does not exist yet as of this checkpoint — it's the very next thing
  to write.
