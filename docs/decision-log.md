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
