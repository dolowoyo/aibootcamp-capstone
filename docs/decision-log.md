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

## 2026-09-14 — CI green checkmarks were misleading; verified manually instead

**Context:** Reviewing PR #63 (W1, app slice) before merging, `gh pr checks` showed all 6
required checks passing. Before trusting that, checked the actual job logs.

**Finding:** PR #63's branch was created before PR #61 (W3, real CI wiring) merged to
`main`. GitHub Actions runs a PR's workflow *file* from the merge-ref of the PR branch with
the base branch — since `.github/workflows/ci.yml`'s real lint/typecheck/unit/build/e2e
commands were still sitting unmerged in #61, PR #63's `lint` job (and the other four) were
actually running the **old placeholder `echo` steps** from Block 0, not real commands. The
green checkmarks were true but meaningless — they proved an echo statement ran, not that
the code was correct.

**Decision:** Did not merge on the strength of that checkmark. Instead, checked out PR #63's
branch locally and ran `npm run lint`/`typecheck`/`test`/`build`/`test:e2e`/`check:traceability`
directly, for real, before approving. All genuinely passed (39/39 tests, real production
build, Tier-2 traceability green across all 4 specs).

**Why this matters for the video:** this is the single clearest demonstration in the whole
project of "verification before completion, evidence before assertions" as a real practice
rather than a slogan — a CI badge that says green is not evidence by itself; what it actually
ran is the evidence. Worth its own beat, since it's the kind of mistake ("CI's green, ship
it") that's genuinely easy to make and easy to miss.

**Consequence for merge order:** confirms the plan to merge #63 (app) before #61 (platform
CI wiring) — once app/ exists on `main`, #61's own CI will get a chance to run the *real*
commands against real code and produce a genuinely meaningful result, rather than #61
merging first and #63 merging into a CI pipeline it was never tested against.

---

## 2026-09-14 — Real container integration testing found two bugs before merging PR #61

**Context:** Before merging W3's platform PR (#61), rebased its branch onto the now-updated
`main` (which has W1's app code from PR #63) to get a genuine CI signal — and, while at it,
actually ran `docker compose build app` and `docker run` locally rather than trusting that
the Dockerfile was correct because it read correctly and had passed structural checks
(`hadolint`, `terraform validate`) in isolation, against code it couldn't see at the time.

**Findings, both real and neither caught by any automated check:**
1. `app/next.config.ts` had a comment describing `output: "standalone"` as required, but
   never actually set the config key. `next build` never produced `.next/standalone/` at
   all — the Dockerfile's later `COPY` of that directory would have failed the moment
   `app/` genuinely existed to build against.
2. The Dockerfile copied `app/node_modules` as a real dependency tree; npm workspaces
   hoists everything to the root `node_modules/`, so `app/node_modules` was empty except a
   stray `.vite` cache directory. This copy step would always have failed or copied nothing
   useful.
3. A third, dependent issue: with `outputFileTracingRoot` pointing one level above `app/`
   (the monorepo root), Next's standalone output preserves that relative path — `server.js`
   lands at `standalone/app/server.js`, not a flat `standalone/server.js`. The Dockerfile's
   copy destinations and `CMD` assumed the flat layout used in single-package (non-monorepo)
   Next.js tutorials.

**Decision:** Fixed all three directly — `output: "standalone"` (committed to `main`, since
that file is part of already-merged PR #63), and the Dockerfile's `node_modules` copy +
nested-path `COPY`/`CMD` (committed to `block-2/w3-platform`, PR #61, not yet merged).
Verified end to end afterward: real `docker build`, real `docker run`, `/api/healthz` →
`200`, and `/`, `/diagnosis`, `/plan`, `/stakeholders` all → `200`.

**Why this matters for the video:** every individual piece of this (W1's config, W3's
Dockerfile) had been reviewed and had passed the checks available to it *in isolation* —
`hadolint`, `terraform validate`, a syntactically valid Next.js config. None of those checks
could catch a mismatch between two files built by two agents who never saw each other's
code. This is the concrete argument for why Block 3 ("integration") is a real phase and not
a formality — parallel worktrees are fast, but they produce exactly this class of bug, and
the only way to catch it is to actually run the whole thing together, not just each piece
alone.

---

## 2026-09-14 — Cross-worktree zod version conflict surfaced during merge

**Context:** Merging `main` (which has W1's app code, `zod ^3.24.1`) into W2's branch
(MCP server + sidecar) before merging PR #62, then regenerating `package-lock.json` to
resolve the conflict, revealed a real build failure: `mcp/onboarding-context` had
independently declared `zod ^4.6.4`. Each worktree chose a reasonable version in isolation;
neither could see the other's choice.

**Finding:** `@modelcontextprotocol/sdk@^1.30.0`'s tool-registration API expects zod v3's
`ZodType` shape. Once both workspaces' dependencies were combined in one npm install (via
workspace hoisting), TypeScript failed to compile `mcp/onboarding-context/src/server.ts`
against the v4-shaped `ZodNumber`/`ZodString` types. This was invisible in each worktree
alone — W2's own `npm ci`, in its own isolated worktree, never saw `app`'s zod v3 at all.

**Decision:** Aligned `mcp/onboarding-context`'s zod dependency to `^3.24.1`, matching
`app`'s already-proven range. The actual zod usage in the MCP server (`z.string()`,
`z.number()`, `.describe()`) has no version-specific API, so this was a safe, code-free fix.
Verified with a full clean reinstall and re-run of every workspace's build/test suite.

**Why this matters for the video:** a second, distinct flavor of the same underlying lesson
as the Dockerfile/next.config.ts findings — three agents built correct code in isolation,
and the SDD process (specs, contracts, traceability) caught the *behavioral* risks well, but
dependency-version drift across parallel worktrees is a class of integration risk that no
amount of spec rigor prevents on its own. It only surfaces when the trees actually merge.
Worth naming as a concrete "what I'd do differently": a shared dependency-version policy
(or at least a shared `package.json` `overrides` field) declared in Block 0, before Block 2's
worktrees fork, would have prevented this rather than requiring it to be caught at merge time.

---

## 2026-09-14 — Diagnosed: custom subagent tool grants freeze at first discovery

**Context:** W1 (Block 2) reported the `Skill` tool wasn't available to it despite
`.claude/agents/builder.md`'s frontmatter granting it — a fix made earlier in this same
session (see the 2026-09-13 "None of the 7 agent definitions could actually invoke a skill"
entry). Investigated with two throwaway diagnostic subagents rather than guessing.

**Finding:** Spawned a `builder`-type subagent and a `general-purpose`-type subagent, each
asked only to report its own available tools and attempt a live `Skill()` call.
`general-purpose` (a built-in type) had `Skill` and used it successfully.
`builder` (a custom, project-defined type) did not — it failed with
`"Skill is disabled for this session, in subagents as well as here."`

The timeline fits exactly: when `builder.md` was first written (Block 0), its `tools:` line
was `Read, Write, Edit, Bash, Grep, Glob` — no `Skill`. The harness's own announcement of the
new custom agent types, at that moment, showed exactly that 6-tool list. `Skill` was added to
the frontmatter afterward, mid-session (Block 1) — but the harness appears to register a
custom subagent type's permitted tools once, at first discovery, and does not re-scan
`.claude/agents/*.md` again within the same session. Editing the file afterward has no
effect until a fresh session re-discovers the agents.

(Incidentally, this also explains why the diagnostic showed no `Grep`/`Glob` for either
agent type: those aren't distinct tools in this environment at all — search happens through
`Bash` — so listing them in frontmatter was always inert, unrelated to the `Skill` gap.)

**Decision:** Restarting the session before Block 3, on Dele's call, so all 7 custom agents
get re-discovered fresh with `Skill` genuinely available going forward.

**Why this matters for the video:** genuinely worth its own beat. The mitigating fact is
also worth stating plainly: Block 2's agents followed their bound-skill instructions
faithfully as *written text* the whole time (real TDD evidence: tests written before
implementation, confirmed red then green; `verification-before-completion` genuinely run
before every PR) — the formal `Skill()` invocation would have loaded superpowers' fuller
methodology write-up, but its absence didn't compromise the actual practice. That's a
meaningful finding about where the value in an agent-definition system actually comes from:
a lot of it is the written instructions an agent reads directly, not only the tooling that
formally invokes a packaged skill.

---

## 2026-09-13 — Block 2's screen capture was never recorded; live footage cannot be recovered

**Context:** Restarting the session ahead of Block 3, Dele asked to first run the app to see
Block 2's state and separately flagged that the plan's screen-recording step for Block 2
("this is the b-roll you cannot recreate afterward") never happened — no QuickTime capture
was running while the three worktrees/agents built in parallel.

**Decision:** The live Block 2 footage is gone and will not be faked as original footage.
Two concrete responses instead: (1) re-enact one short, real segment of the multi-agent
worktree workflow — driven against genuine outstanding work (e.g. the `/api/readyz` gap),
not a scripted fake — with Dele recording live so the video has honest b-roll, clearly
distinct from a claim that it's the original Block 2 run; (2) Block 3 (integration) will be
recorded live from the start so it doesn't repeat the gap.

**Why:** Recreating "Block 2 exactly as it happened" isn't possible or honest — the merged
PRs, decision log, and git history are the real record of that block. Best move is to be
transparent about the miss and make sure the same mistake doesn't recur in Block 3, rather
than manufacturing footage that misrepresents when it was captured.

**Alternative considered:** Rely solely on static artifacts (PRs, decision-log, git log) for
the video's Block 2 beat with no re-enactment footage at all — rejected only insofar as
Dele asked for a short re-enactment in addition, not instead.

---

## 2026-09-14 — Live sidecar wiring surfaced three real bugs no mocked test could catch

**Context:** Block 3's core integration task — running the sidecar adapter
(`lib/inference/adapters/sidecar.ts`) against a real, running `services/inference-sidecar`
process backed by a genuine `claude-agent-sdk` call, for the first time. SPEC-000's own
Out-of-Scope section had explicitly deferred this: "conformance ... does so against a mocked
HTTP/SDK boundary, not a live call." All unit tests were green going in.

**Finding 1:** `zodToJsonSchema(schema, "SomeName")` (both call sites) emits a top-level
`{ $ref, definitions }` wrapper with no top-level `"type"`. The Agent SDK's `outputFormat:
{type: 'json_schema'}` is implemented as an end-turn tool call, and the Anthropic API
requires a tool's `input_schema` to be object-typed at the top level — a `$ref`-wrapped
schema fails with `input_schema.type: Field required`, surfaced through the sidecar as a
502. **Fixed:** drop the `name` argument; added a regression test pinning the request body
shape (`sidecar.spec.ts`).

**Finding 2:** `generatePlan`'s domain type is `Milestone[]` — an array — which violates the
same object-typed `input_schema` constraint (`input_schema.type: Input should be 'object'`).
**Fixed:** wrap the wire schema/response as `{ milestones: Milestone[] }`, unwrap on
receipt. Also fixed `provider.contract.spec.ts`'s mock, which had encoded the old (buggy)
wire shape and would have masked this exact bug in CI.

**Finding 3:** `sidecar.ts` (client) and `agent-query.ts` (server) shared an identical 30s
timeout with zero margin — a live call that legitimately took just over 30s server-side
(30028ms) was aborted client-side moments earlier, discarding a response that would have
succeeded. **Fixed:** client timeout set strictly longer than server timeout (+10s margin)
for each operation.

**Finding 4 (confirmed with Dele, not decided silently):** even after fixing Finding 3,
`generatePlan` consistently hit the *server's own* 30s Agent SDK timeout in live testing
(2/2 real attempts landed at ~30.0s or over) — a full 3-phase milestone plan is a
meaningfully heavier generation task than a single STARS diagnosis (which reliably finished
in 15-27s). `PLAN-000` had deliberately set 30s as a tradeoff between "long enough for cold
start" and "short enough that a hang is legible on camera" during the demo, and SPEC-000
explicitly scoped retry/backoff policy out — so raising the timeout is a real tradeoff call,
not a pure bug fix. Presented options (raise `/plan`'s timeout only, add a retry policy, or
file as a known issue and move on) via `AskUserQuestion`; Dele chose to raise `/plan`'s
server-side budget only (30s → 60s, client 40s → 70s), leaving `/diagnose` at its original
30s so the demo's diagnosis path keeps `PLAN-000`'s original camera-legibility property.

**Also discovered, not a bug:** the `claude` CLI is not on `PATH` in this environment — it
only exists bundled inside the versioned VS Code extension directory. This didn't block
anything: `@anthropic-ai/claude-agent-sdk-darwin-arm64` ships its own bundled executable that
the SDK uses directly, confirmed working with real subscription auth. Logged in `STATE.md`
so a future session doesn't misdiagnose `which claude` failing as an auth blocker.

**Why this matters for the video:** SPEC-000 explicitly named "not a live call" as an
acknowledged gap in its own scope section back in Block 1 — this is that gap closing
exactly as anticipated, and it found real, non-obvious bugs (a JSON-Schema library default
that only breaks against a real tool-calling API, not a mock; a timeout race that only shows
up under real latency) that no amount of additional mocked-boundary unit testing could have
caught. It's a concrete, second instance of the Block 3 thesis first established by the
Dockerfile/`next.config.ts` and zod-version findings: parallel/isolated work is fast, but
integration against the real thing is where a distinct class of bug actually surfaces.

**Note on process:** PR #65 (this fix) could not be merged by the agent session — `gh pr
merge` was denied by Claude Code's auto-mode safety classifier ("Merge Without Review"),
the same class of guardrail that blocked self-approval during Block 1's branch-protection
work. All 6 required checks are green; merge is pending Dele.

---

## 2026-09-14 — No Prisma migration mechanism existed anywhere; added a one-off `migrate` service

**Context:** Manually verifying SPEC-004's cross-route persistence fix (PLAN-004, Task 6)
against a real `docker compose up --build` container. `psql \dt` showed zero tables — no
migration or `db push` step existed anywhere in the project (`app/prisma` has no
`migrations/` directory; nothing in `Dockerfile`, `docker-compose.yml`, or any `package.json`
script ever applies `schema.prisma` to a database). This predates this session entirely; it
never surfaced before because `/api/readyz`'s liveness check is a tableless `SELECT 1`, and
Tasks 2-5's repository work was the first code to ever exercise a real table against a real
Postgres instance.

**Decision:** Added a `migrate` service to `docker-compose.yml`, built from the `Dockerfile`'s
`builder` stage (which already has the Prisma CLI and schema file for the pre-existing
`prisma generate` build step; the `app` runner image deliberately doesn't, since Next's
file-tracing for `output: standalone` only includes what the compiled server bundle actually
requires at runtime). It runs `prisma db push --accept-data-loss --skip-generate` once and
exits; `app` now depends on it via `condition: service_completed_successfully`. Verified with
a fully fresh volume (`docker compose down -v && up --build`): zero manual steps needed,
`migrate` exits 0, all four tables exist immediately after, `app` comes up healthy.

**Why `db push` over `migrate deploy`:** no migration history exists yet in this project, and
this compose stack only ever targets a single local demo database containing fabricated
fixture/test data (`docs/constitution.md` principle VII) — migration-file provenance and the
data-loss guardrails `migrate deploy` exists for don't apply the same way here.
`--accept-data-loss` is safe for the same reason; it would not be an acceptable default
against a shared or production database.

**Known gap, not fixed here:** `infra/terraform/main.tf`'s Docker-provisioned stack
(`docs/adr/0003-local-iac.md`) has the identical problem — it provisions Postgres and the app
container with a `DATABASE_URL` but nothing applies the schema. Anyone running the Terraform
path hits the same "relation does not exist" failure `docker-compose.yml` just fixed. Not
addressed in this PR (out of scope for SPEC-004, which is about the app's persistence wiring,
not infra provisioning) — filed as a GitHub issue instead, per constitution principle VI
(scope drift becomes a filed issue, never a silently-left gap).

**Why this matters for the video:** a second, distinct instance of a class of finding that's
recurred throughout Block 3 — a piece of infrastructure plumbing (Prisma migrations, in this
case) that every individual piece of work assumed was someone else's problem, surfaced only
by actually running the real stack end to end rather than trusting that "the schema exists"
because the ORM code compiles.

---

## 2026-09-15 — Publishing the app image for the first time surfaced four bugs in a row

**Context:** Completing Block 3's Terraform verification required a real published app
image — `infra/terraform`'s `docker_image.app` always pulls from GHCR, never builds
locally. No tag had ever been pushed in this repo, so `publish.yml` had never actually run.
Pushed `v0.1.0` to trigger it.

**What happened, in the order each was found (each only visible once the previous one was
fixed and the workflow got further than before):**

1. `publish.yml` referenced `aquasecurity/trivy-action@0.29.0` (missing the tag's real `v`
   prefix) — the action itself failed to resolve. Confirmed via the GitHub API that the
   real tag is `v0.29.0`.
2. Fixed, retried — `trivy-action@v0.29.0` itself pins `aquasecurity/setup-trivy@v0.2.2`
   internally, a tag that no longer exists in that repo. Bumped to `trivy-action@v0.36.0`,
   which pins `setup-trivy` by commit hash instead of a mutable tag.
3. Fixed, retried — the workflow finally got far enough to build and push the image for
   real, then genuinely failed Trivy's CRITICAL/HIGH gate. Confirmed real (not a config
   bug) by installing `trivy` locally and reproducing before touching anything: npm's own
   bundled `tar`/`sigstore` (used only for `npm install`'s package-fetching/provenance,
   never exercised in this runtime image — removed outright), a stale nested
   `postcss@8.4.31` pinned inside `next@15.5.25` itself (fixed via an `overrides` entry,
   which needed a fully fresh `package-lock.json` regeneration before it actually took —
   a stale lockfile silently kept the old resolution even after `node_modules` was wiped),
   and an outdated Alpine `libssl3`/`libcrypto3` in the cached base layer (fixed with an
   explicit `apk upgrade`).
4. Fixed, retried — the image built and passed Trivy, but was amd64-only
   (`build-push-action`'s default when no `platforms` is set is the runner's own
   architecture). `docker pull` failed on this Apple Silicon host with "no matching
   manifest for linux/arm64/v8." Added `platforms: linux/amd64,linux/arm64` plus
   `docker/setup-qemu-action` (buildx alone doesn't provide cross-arch emulation).

`infra/terraform/main.tf` itself also had two of the same gaps `docker-compose.yml` had
already hit and fixed: `SIDECAR_URL` instead of `INFERENCE_SIDECAR_URL`, and no mechanism
to apply `prisma/schema.prisma` to a fresh Postgres. Fixed both (the latter via a
`docker_container.migrate` resource, built from the `Dockerfile`'s `builder` stage, using
the `must_run=false`/`attach=true` pattern so Terraform genuinely waits for it to finish
before creating the app container).

**Result:** a full `terraform apply` succeeded end to end for the first time — all 7
resources, real Postgres, real schema migration, real published multi-arch image, real
`healthz`/`readyz` 200s — then `terraform destroy` cleanly, leaving a genuinely fresh slate
for the recorded demo's live `terraform apply`.

**Why this matters for the video:** four independent, unrelated bugs, each hidden behind
the previous one, all in a code path (`publish.yml`) that had literally never executed
before today despite existing since early in the project. This is the sharpest example yet
of this capstone's recurring theme — CI passing and code compiling prove nothing about a
path nobody has actually run — because here it wasn't one bug caught by "actually running
it," it was a whole queue of them, each waiting behind the last.

**Time-pressure note:** this work happened right before the planned recording session, and
Dele explicitly chose to wait for the real Terraform apply to finish rather than cut it
per `docs/00-capstone-plan.md`'s own stated cut-line rule — a deliberate call to keep the
video's platform beat honest (a real `apply`, not a `docker compose` substitute) even under
time pressure, not an accident of not noticing the cut-line existed.

---
