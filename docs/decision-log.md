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

## 2026-09-13 — None of the 7 agent definitions could actually invoke a skill

**Context:** Starting Block 1, about to launch `product-owner` to run the `brainstorming`
skill per CLAUDE.md rule #2. Checked each agent definition's frontmatter `tools:` list before
launching and found none of the seven granted the `Skill` tool — only `Read`, `Write`,
`Edit`, `Bash`, `Grep`, `Glob`, `WebFetch` in various combinations.

**Decision:** Added `Skill` to every agent's tool list before running any of them.

**Why:** The entire agent design in `.claude/agents/*.md` is built around each agent invoking
a specific bound superpowers skill for its phase (brainstorming, writing-plans,
test-driven-development, etc. — see `CLAUDE.md`'s bound-skills table). Without `Skill` in
its tool grant, an agent literally cannot call `Skill()` — it would either fail outright or
silently improvise the phase instead, which is precisely the failure mode the whole binding
was designed to prevent. This would have surfaced the first time any agent actually ran,
and might have looked like the agent "ignoring" its instructions rather than being unable
to follow them — a much harder failure to diagnose after the fact than to prevent up front.

**Why this matters for the video:** writing an agent's *instructions* to use a skill and
granting the *capability* to use it are two different steps, and it's easy to do the first
without the second — a genuine, specific finding about building multi-agent systems, not a
generic "always check your config" moral.

---

## 2026-09-13 — Backlog depth and SPEC-003 scope, confirmed with Dele

**Context:** `product-owner` filed 24 issues (3 shipped epics, 1 infra task, 12 stories, 8
backlog-only epics) and flagged two open questions rather than deciding them itself, per its
mandate not to own scope.

**Decision:** (1) Backlog epics stay at epic-level only — no story breakdown for unshipped
work. (2) `#23 Coalition Action Planner` (what to *do* about stakeholder influence/support)
stays a separate backlog epic; `SPEC-003` ships as a static influence×support map only, not
map-plus-recommendations.

**Why:** Story-level detail on work that won't be built this capstone is lower-value than
moving to the actual specs now — epic-level breadth across 8 distinct concepts already
demonstrates real discovery depth. Keeping SPEC-003 to a static map keeps its AC list tight
and testable within the time budget, rather than quietly growing scope right before the
spec is even written — a good example of principle IX (ship the cut, keep quality) applied
before the cut was even necessary, not after time pressure forced it.

---

## 2026-09-13 — SPEC-000 drafted; two real findings from architect

**Context:** `architect` drafted `SPEC-000` (inference provider contract, 11 ACs) — the
foundational spec everything else depends on.

**Finding 1 (bug):** `docs/specs/_TEMPLATE.md` showed the traceability table's Test column
wrapped in backticks, but `scripts/check-traceability.ts` split each cell on `>` without
stripping them — so any spec author who copied the template literally would produce a
traceability row that could never resolve, even once the real test file existed, because the
parsed "file path" would carry a permanent stray backtick. Architect caught this by hand-
checking their own table before it was ever exercised by CI. **Fixed both sides:** the script
now strips leading/trailing backticks defensively, and the template (plus the matching
example in the `capstone-conventions` skill) no longer uses backticks in that column, so the
next spec author won't reproduce the mistake in the first place.

**Finding 2 (real design question, not silently decided):** SPEC-001/SPEC-002 conceptually
own the actual field shapes of `StarsDiagnosis` and the milestone objects, but those schema
*modules* need to exist before SPEC-000's adapters can be built, and before SPEC-001/002
exist to define them. **Resolved with Dele:** `PLAN-000` defines schema module locations and
the validation mechanism only; `SPEC-001`/`SPEC-002` own and commit the actual field
contents once written. Logged directly in SPEC-000's Open Questions section as resolved,
not just here.

**Why this matters for the video:** both are exactly the kind of finding a spec-first process
is supposed to surface *before* three parallel builders hit them independently in Block 2 —
the traceability bug would otherwise have surfaced as "the CI check is broken" days later
with no obvious cause, and the schema-ownership question would otherwise have been three
different guesses from three different agents.

---

## 2026-09-13 — Traceability gate redesigned as two-tier, before merging the first spec

**Context:** About to merge `SPEC-000` via a real PR to exercise the required `traceability`
CI check for the first time. Running the check locally against the finished spec revealed a
design flaw: the script required every traceability row to resolve to a real, existing test
file — but specs are meant to merge in Block 1, before their tests exist (that's the entire
point of spec-first development; tests come from `builder`'s TDD in Block 2). Once SPEC-000
merged, `main`'s required `traceability` check would have stayed red for the rest of Block 1
and much of Block 2 — blocking every subsequent PR, including the three parallel Block 2
builds, none of which individually satisfy all ACs across all four specs at once.

**Decision:** Split enforcement into two tiers. **Tier 1** (always enforced, any spec status):
every declared AC has exactly one well-formed traceability row, no dangling references, no
duplicates. **Tier 2** (enforced only once a spec's `Status:` field reads `implemented`):
every row must resolve to a real test file containing the named test title. A spec merges as
`draft`/`approved` with Tier 1 passing and Tier 2 not yet applicable; whoever's PR adds the
real tests flips the spec to `implemented` in that same PR, and from then on Tier 2 enforces
for real — so the "delete a row, watch CI go red" demo moment still works exactly as
designed, just against a spec that's actually reached that stage.

Verified before trusting it: ran the check against `SPEC-000` at `Status: approved` (passed,
Tier 2 skipped as expected), then against a copy manually flipped to `Status: implemented`
with the same missing tests (failed with a specific, correct violation), then restored the
real file and reconfirmed green.

**Why:** This is the second real gap the traceability gate's *design* — not its parsing —
had before a single spec was merged (the first was the backtick bug). Both were caught by
actually trying to use the gate for its real purpose rather than only testing it against a
throwaway fixture in Block 0. The throwaway test proved the *parser* worked; it didn't
prove the *policy* was coherent across a multi-spec, incrementally-implemented project — a
distinction worth being explicit about, since it's an easy one to miss.

---

## 2026-09-13 — SPEC-001/002/003 + plans + tasks + ADRs resolved

**Context:** `architect` drafted SPEC-001 (STARS diagnosis, 8 ACs), SPEC-002 (30/60/90 plan,
8 ACs), SPEC-003 (stakeholder map, 7 ACs), all four plans (PLAN-000..003), all four task
breakdowns (33 GitHub issues filed, #27-59), and ADR-0002/0003 — flagging 8 assumptions/open
questions rather than silently deciding any of them.

**Decisions:**
- SPEC-001: thin/ambiguous intake still produces a Low-confidence diagnosis with an explicit
  caveat, never a refusal — confirmed with Dele (pipeline never strands the user with
  nothing).
- SPEC-001/002: overriding a diagnosis after a plan already exists never auto-regenerates or
  discards that plan — confirmed with Dele. Regeneration is always an explicit user action;
  the original diagnosis is preserved internally (not user-facing) precisely so a future
  regenerate action has something to diff against.
- SPEC-001: 50-character narrative minimum and categorical (Low/Medium/High) confidence —
  both confirmed as reasonable, low-stakes defaults.
- SPEC-003: the 5.5-midpoint/ties-resolve-low quadrant tie-break rule (PLAN-003), and
  "incomplete record" scoped to a missing influence/support value specifically (not any
  missing field) — both confirmed as reasonable.
- PLAN-003's schema living at `lib/stakeholders/schema.ts` rather than `lib/inference/schemas/`
  — confirmed; it's genuinely a different boundary (MCP client, not LLM inference), so a
  separate location is the more honest structure, not an inconsistency.

**Flagged, not a decision — a Block 2 coordination risk:** `PLAN-003`'s MCP client interface
is written against tool names/shapes described in `docs/00-capstone-plan.md`, not a real,
tested server (`mcp/onboarding-context` doesn't exist until Block 2's W2 worktree). Whoever
builds the app-side stakeholder feature (W1) and whoever builds the MCP server (W2) should
reconcile the exact tool contract early in Block 2, before either builds deeply against an
assumed shape. Noted in `docs/STATE.md` as a standing Block 2 coordination item.

**Why this batch approach:** all three specs plus their downstream plans/tasks/ADRs were
authored together as one coherent architect pass building on the same merged SPEC-000, so
reviewing and merging them as one PR is the right grain — three separate PRs would have
added ceremony without adding independent review value, since none of the three specs could
sensibly merge without the other two also existing (SPEC-002 depends on SPEC-001; the task
issues reference all three).

---

## 2026-09-13 — MCP tool contract formalized before Block 2 starts

**Context:** `PLAN-003` flagged a real coordination risk — its `mcp-client.ts` interface was
written against prose in `docs/00-capstone-plan.md`, not a real, tested `mcp/onboarding-context`
server. Block 2 puts the app-slice builder and the MCP-server builder in separate worktrees,
working in parallel with no natural sync point until their PRs merge — exactly the setup
where two independently reasonable guesses diverge.

**Decision:** Wrote `docs/mcp-tool-contract.md` — concrete input/output shapes for
`list_meetings`, `search_people`, `get_reporting_chain` — as the single authoritative
reference both builders read before writing code. Split responsibility explicitly: the
server exposes raw signals only (meetings, people, reporting chain); `lib/stakeholders/
mcp-client.ts` (app side) owns influence/support derivation, per PLAN-003's own design.

**Why:** Reconciling this after both worktrees have already built independent assumptions
is strictly more expensive than reconciling it before either starts — the whole point of
flagging it in Block 1 was to fix it now, not rediscover it as an integration failure in
Block 3. Not a spec (no ACs, not traceability-enforced) because it's an interface reference
document, not a testable-behavior spec — named without a `SPEC-` prefix specifically so
`check-traceability.ts` doesn't try to parse it as one.

---

## 2026-09-14 — Missed a second coordination contract before Block 2 launch

**Context:** Before launching Block 2's three parallel worktrees, I pre-resolved the MCP
tool contract (`docs/mcp-tool-contract.md`) specifically because `PLAN-003` had flagged it as
a coordination risk. I didn't do the equivalent for the inference sidecar's HTTP wire shape
(request/response format between `lib/inference/adapters/sidecar.ts` in the app worktree and
`services/inference-sidecar/` in the MCP worktree) — `PLAN-000` only specifies the
`InferenceProvider` interface, not that wire shape, and nothing flagged this one in Block 1
the way `PLAN-003` flagged the MCP contract. W2 (MCP-server builder) hit it directly, had to
design the contract itself mid-task, and documented it clearly in
`services/inference-sidecar/README.md` rather than silently guessing.

**Decision:** Caught this while W2's PR was still the only one back and W1 (app-slice
builder) was still running — sent W1 the real contract via `SendMessage` before it could
finish building `sidecar.ts` against an independent guess, rather than discovering a mismatch
only after both PRs were open.

**Why this matters for the video:** the MCP contract worked because I anticipated the risk
in Block 1. This one didn't get anticipated the same way, and the fix — a live mid-flight
message to a running background agent, using the actual documented contract the other agent
had just produced — is a genuinely interesting "gotcha" and recovery, arguably a better one
than the case that went right the first time. Worth naming honestly in the video rather than
only showcasing the contract that was caught in advance.

---
