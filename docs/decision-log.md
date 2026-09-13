# Decision Log

Append-only. Every entry is a place a human (Dele) made, overrode, or redirected a decision
that an agent could plausibly have made differently. This is not a changelog — it's the trail
of judgment calls, kept because it's the primary source for "how did you leverage AI",
"gotchas", and "what I'd do differently" in the capstone video.

Newest entries at the bottom. Never edit or delete a past entry — if a decision was later
reversed, add a new entry saying so and link back.

Format:

```markdown
## YYYY-MM-DD HH:MM — <short title>
**Context:** what prompted this
**Decision:** what was decided
**Why:** the reasoning
**Alternative considered:** what else was on the table, if anything
```

---

## 2026-09-13 — Planning session: scope, stack, and inference method

**Context:** Capstone planning in Claude Code plan mode, before any code was written.

**Decision:** Ship one vertical slice (STARS diagnosis → 30/60/90 plan → stakeholder map)
rather than the full Watkins framework; run inference through the Claude Agent SDK on
existing Claude Code subscription auth rather than an API key; deploy locally via Docker +
Terraform (`kreuzwerker/docker` provider) rather than a cloud target; run spec-driven
development as the project's spine rather than a single phase; enforce it with a traceability
script in CI rather than convention alone.

**Why:** No Anthropic API key or cloud account was available. Rather than narrowing ambition
to fit the constraint, the constraint was solved architecturally — a host-side inference
sidecar lets the containerized app call the Agent SDK on the host, where the keychain and
`claude` CLI exist. Hard-gating traceability in CI (rather than relying on the reviewer agent's
judgment) makes the SDD claim provable on camera instead of merely narrated.

**Alternative considered:** Cutting the slice down to something that didn't need real
inference (a CRUD app with AI "sprinkled on"). Rejected — it would have been a weaker
capstone story than solving the actual constraint.

---

## 2026-09-13 — Repo made public

**Context:** Branch protection and required status checks are not available on free-tier
private repos.

**Decision:** `dolowoyo/aibootcamp-capstone` set to public.

**Why:** Needed for the CI-gate demo (a required-checks merge block is a core "best practices"
beat) and gives the cohort a shareable link. All committed data is fabricated per the
capstone's no-client-data rule, so there is no exposure risk in going public.

---

## 2026-09-13 — Dropped required-review count from branch protection

**Context:** Set branch protection on `main` with 6 required status checks *and* 1 required
approving PR review — the textbook "best practices" combination. Before relying on it, tried
to verify empirically that a solo GitHub account can self-approve its own PR (there's no
second human contributor on this project). The test itself was blocked: Claude Code's own
auto-mode safety classifier refused the self-approval action before it ever reached GitHub's
API, on the reasonable grounds that self-approving a PR is a meaningful trust action. That
left the underlying GitHub behavior unverified rather than confirmed either way.

**Decision:** Removed the required-review count from branch protection entirely (now `null`).
Merge gates purely on the 6 required status checks (`lint`, `typecheck`, `traceability`,
`unit`, `build`, `e2e`). The `reviewer` agent still performs its full checklist and posts a
real, structured GitHub PR review — via `gh pr review --comment`, not `--approve` — so the
review is a visible, permanent artifact even though it isn't the mechanical merge gate.

**Why:** Depending on an unverified assumption for the demo's core merge-gate mechanic was
the wrong risk to carry into Block 1-3. A CI-only gate is unambiguous, testable, and matches
how solo/small-team projects actually operate in practice — requiring a second human
reviewer on a one-person project is process theater, not a real safeguard. This is a
better, more honest "gotcha" for the video than a working-until-it-isn't review requirement:
it demonstrates recognizing when a safety guardrail (the harness blocking self-approval)
is telling you something true about the design, not just an obstacle to route around.

**Alternative considered:** Verifying self-approval manually via the GitHub web UI and
keeping the requirement if it worked. Rejected for now — even if it works today, it's a
single point of failure with no fallback if it doesn't, right when the merge flow is on the
critical path. Can be revisited if there's time to spare later.

---

## 2026-09-13 — Slimmed CLAUDE.md; moved phase-specific detail to on-demand files

**Context:** Dele flagged that `CLAUDE.md` (158 lines) risked loading too much context at
every session start, when most of its content is only relevant during specific phases of
work.

**Decision:** Restructured. `CLAUDE.md` kept only what's true in every session: the identity
note, the 5 non-negotiable rules, a compact bound-skills table, one paragraph on session
continuity (with pointers), one paragraph on the inference boundary (with a pointer), data
policy, and the don't-list — 98 lines / ~675 words, down from 158/~1045.

Moved: the full SDD chain diagram + traceability mechanics → merged into the
`capstone-conventions` skill (which already covered adjacent ground — this also removed a
real duplication, not just a relocation). The full inference-boundary diagram and reasoning
→ `docs/adr/0001-inference-boundary.md` (a real ADR, pulled forward from its originally
planned Block 1 slot). The full session-continuity mechanics were already living in
`.claude/commands/checkpoint.md` / `resume-capstone.md` — CLAUDE.md's copy was redundant and
got cut to a pointer. The "Conventions" section was fully redundant with
`capstone-conventions`'s existing "Git conventions" section and was deleted outright.

**Why:** Skills and ADRs are loaded on demand (by name, or when an agent actually touches the
area they govern) — CLAUDE.md is loaded into every session regardless of relevance. Content
that's only needed 20% of the time doesn't belong in the 100%-of-the-time file. This is a
direct, concrete application of context engineering (Session 2 on the learning roadmap) to
the project's own scaffolding, not just to the app being built — worth its own beat in the
video rather than folding it into a generic "we used CLAUDE.md" mention.

**Alternative considered:** Using `@path` imports inside CLAUDE.md to reference the other
files. Rejected — imports are resolved and inlined at session start same as the rest of the
file, so it wouldn't have reduced what's actually loaded; only genuinely on-demand
mechanisms (skills, ADRs read when relevant) do that.

---

## 2026-09-13 — Terraform was never actually installed; installed the binary directly

**Context:** Dele reported running `brew install terraform` before Block 0 began. Verifying
before Block 1 (`terraform version`) showed it wasn't on PATH at all.

**Decision:** Investigated rather than re-running the same command blindly. Found that
HashiCorp removed `terraform` from `homebrew-core` some time ago over licensing (BSL) — so
`brew install terraform` errors out immediately with no formula found, rather than silently
succeeding. The documented fix, `brew tap hashicorp/tap` then `brew install
hashicorp/tap/terraform`, also failed: the tap clone itself errors under current Homebrew's
formula-trust policy, because unrelated formulas in the same tap (`boundary`,
`consul-enterprise`, etc.) are flagged untrusted and the whole tap operation aborts — not a
terraform-specific problem, but it blocks reaching terraform's formula regardless.

Installed the official v1.16.2 `darwin_arm64` binary directly from
`releases.hashicorp.com`, verified against HashiCorp's published SHA256SUMS before use, and
placed it in `/opt/homebrew/bin` (already on PATH). Verified with `terraform version`.

**Why:** A single retry of the same failing command wastes time without new information;
the actual failure mode (Homebrew's tap-trust policy rejecting an unrelated formula) was
worth 5 minutes to understand rather than 30 minutes of trial and error later, closer to
the Block 3 deadline when Terraform is actually needed. Verifying the download's checksum
before executing an unsigned binary is table stakes, not optional, even under time pressure.

**Why this matters for the video:** a genuinely reproducible "gotcha" — "I ran the install
command" turned out not to mean "it's installed," and the assumption would have surfaced at
the worst possible time (mid-Block-3, with the demo clock running) if not checked now.

---
