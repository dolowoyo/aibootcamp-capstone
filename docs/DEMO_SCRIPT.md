# First 90 — Capstone Demo Script (5:00 target)

Written to be read aloud on camera, for a **mixed audience — not everyone watching writes
code.** Every technical beat leads with a plain-language "here's why this matters" line
before the specifics, so someone non-technical still gets something real out of it, not
just a wall of tool names. The technical specifics still follow immediately after — the
capstone is graded on the technical depth, so nothing gets watered down, just translated
first.

`[SAY]` blocks are narration; `[DO]` blocks are what to click/show/type. Timings are
targets, not hard stops — if a beat runs long, cut from "What I'd do differently" first
(shortest, most compressible), then trim gotchas to 2 instead of 4. Don't cut the live
`terraform apply` or the traceability-gate demo — those are the two moments that prove the
process was real, not narrated, and they're also the most visually self-explanatory beats
for a non-technical viewer: something breaks, or something catches a mistake, on screen, in
real time. No jargon required to follow those two.

Pre-flight, before hitting record:
- [ ] `docker compose down -v` (clean slate) — do NOT pre-run `terraform apply`, that has to
      happen live in the 2:15 beat.
- [ ] Confirm `git log --oneline -5` on `main` shows the real merge history you're about to
      talk through.
- [ ] Have `docs/decision-log.md` open in a second tab/window to read exact numbers from
      live if memory fails on a beat.
- [ ] Confirm `infra/terraform` — `terraform state list` is empty (destroyed, per the last
      checkpoint) so the live apply is genuinely "from nothing."

---

## 0:00–0:45 — Overview (45s)

**[SAY]**
"Everyone in this room has started a new job. You remember the feeling — a hundred things
you don't know yet, and no clear sense of what actually matters in the first few weeks.
Research on this — Michael Watkins' 'The First 90 Days' — says that window quietly decides
whether the hire works out, and almost nobody gets real structured help through it. First
90 is an assistant built around that research: you describe your new role in your own
words, it figures out what *kind* of situation you've walked into, builds you a real
30/60/90-day plan around it, and helps you map out who you'll need on your side."

**[DO]** Show the running app (`docker compose up --build`, already warm — this beat is
about the product, not the infra, that comes later):
- `/diagnosis` — paste a real narrative, submit, show the result (what kind of situation
  it thinks you're in, how confident it is, and — importantly — its reasoning quoted back
  in your own words, not a generic template).
- `/plan` — generate, show milestones grouped across the first 30, next 30, and final 30
  days, each with a plain-language reason tied to your specific situation.
- `/stakeholders` — add one manually, show it land in the right spot on a simple
  who-do-I-need-on-my-side map.

**[SAY]** "That's the product — something anyone starting a new role could actually use.
The more interesting story, for this room, is how it got built."

---

## 0:45–2:15 — How I leveraged AI (90s)

**[SAY]**
"Here's the plain version first: I didn't just ask an AI to write code and hope for the
best. Every single piece of this was built against a written, numbered checklist of exactly
what 'done' means — and a robot, not me, checks the finished work against that checklist
every time, automatically, before anything ships. Think of it like a building inspector who
never gets tired and never skips a step."

**[DO]** Show the chain on screen: `docs/constitution.md` → a `docs/specs/SPEC-00N` file →
its `docs/plans/PLAN-00N` → `docs/tasks/TASKS-00N` → a closed GitHub issue → the test file
its traceability table points at → the merged PR.

**[SAY]**
"For anyone who does write code: that's spec-driven development, with a traceability table
enforced mechanically in CI — a script that fails the build if a spec's acceptance
criteria and its tests ever disagree. Not a policy anyone has to remember to follow.

Seven different AI 'roles' actually did the work — think of them like a small team where
each person has one job and one toolkit: an architect who only writes specs, a builder who
only implements against an already-approved plan, a reviewer whose entire job is checking
someone else's work, and so on. At one point three of them worked at the same time, each in
their own isolated copy of the project — like three contractors each finishing a different
room — and came back together as three separate pieces of work I merged one at a time,
catching the handful of things that only go wrong once separate work tries to fit back
together."

**[DO]** Show `.claude/agents/*.md`, and the three merged Block 2 PRs (#61, #62, #63) in the
PR list.

**[SAY]**
"And the stakeholder map you saw earlier is backed by a real internal service serving the
same organizational data to both the running app and to the AI agents that built against
it — one shared, written source of truth, instead of two different builders each guessing
at what the other one meant."

---

## 2:15–3:00 — Platform + the gate (45s)

**[SAY]** "Everything you're about to watch is real, not staged — no cloud account for this
project, so this runs against real infrastructure automation pointed at my own machine
instead. Watch this command build an entire running system — a network, a database, the
app — from absolutely nothing."

**[DO]** Live, on camera:
```sh
cd infra/terraform
terraform apply -var="image_tag=0.1.0"
```
Let it actually run — network, Postgres, a one-off migration container that applies the
Prisma schema, then the app container, pulling the real image from GHCR. Then:
```sh
curl http://localhost:3000/api/healthz
curl http://localhost:3000/api/readyz
```
Both `200` — the second one confirms a real database query just succeeded, not just that
something is technically running.

**[SAY]**
"Now here's the proof that everything I said a minute ago about an automatic inspector
isn't just a story."

**[DO]** Open a spec's traceability table, delete one row, commit, push, show the
`traceability` required check go red in the PR within seconds. Then revert.

**[SAY]** "I just deleted one line from that checklist. Watch how fast the system notices."
[point at the red X] "Ten seconds. Nobody has to trust that I followed the process — the
system itself refuses to let something through if I didn't."

---

## 3:00–4:15 — Learnings + gotchas (75s)

Pick 3-4 of these live, in whichever order feels natural — don't try to fit all of them.
Each one leads with the plain-language version; the technical specifics are there for
credibility with the people in the room who'll recognize them.

1. **Ran into a wall, and it changed the design.** The AI tool this runs on needs to prove
   its identity using a security credential that lives on my actual laptop — and that
   credential simply doesn't exist inside a sealed, portable container, by design, for
   security reasons. Instead of dropping the feature or cutting a corner, I split the
   system in two: a small helper process on my own machine holds the credential and does
   the real thinking; the sealed, portable part talks to it over the network and never
   touches the credential at all. *(Technical: Claude Agent SDK auths via a CLI reading the
   macOS keychain — neither exists in a Docker container — so a host-side inference
   sidecar owns both, and the containerized app talks to it over HTTP. Fixture mode stays
   the default everywhere else, so the shipped container needs zero credentials.)*

2. **Testing something that gives a different answer every time.** An AI that writes a
   fresh answer every time you ask is genuinely hard to test automatically — how do you
   check a result you can't predict? The fix: every automated test runs against a fixed,
   canned set of realistic answers instead of calling the live AI, so the *same* input
   always produces the *same*, checkable result. The live AI is still there for the real
   product — just not for testing it. *(Technical: a fixture inference adapter behind the
   same interface as the real one, swapped in for every test and CI run.)*

3. **"It says pass" isn't the same as "it works."** One piece of work showed every green
   checkmark — every automated check said pass. I checked anyway before approving it, and
   found the checks had genuinely been running an empty placeholder step this whole time,
   not the real ones — through no one's fault, just an ordering accident between two
   pieces of work landing at slightly different times. The lesson that applies well beyond
   coding: a checklist that says "pass" is only worth as much as what it actually checked —
   verify that, don't just read the checkmark.

4. **Today's freshest one — publishing this for the first time uncovered four separate,
   unrelated problems, one behind the next.** Shipping this project's container image
   somewhere real, for the very first time, needed to happen for the infrastructure demo
   you just watched. The moment I actually tried it — something that had sat untested since
   early in the project — it failed. I fixed that, tried again — it failed differently.
   That happened four times, each one a genuinely different, unrelated issue, each one
   invisible until the one before it was out of the way. Nothing here would have shown up
   by reading the code carefully; every one of them only existed the moment something
   real actually tried to run. *(Technical, for the record: a wrong version tag on a
   security-scanning step, a dead internal dependency inside that same tool, real
   vulnerabilities in the shipped image once the scanner could finally run, and a build
   that only worked for one CPU architecture.)*

**[SAY, to close this beat]** "Every one of those is written down in the project's decision
log, dated, with what I tried and why — not reconstructed after the fact for this video."

---

## 4:15–5:00 — What I'd do differently (45s)

**[SAY]**
"Three things, and I'll keep these plain since they're really about how to run any project
well, not just this one.

First: build the safety net before you start building on top of it, not alongside it. I
found two real gaps in my own automatic checker only because I happened to test it for
real before I trusted it — that should have been the very first thing I did, not something
I scrambled to fix midway through.

Second: start narrower than feels comfortable. This framework covers a lot of ground —
team assessments, tough conversations with your boss, a full organizational map — and I
deliberately built one complete slice end to end instead of a little bit of everything. I'd
cut it even tighter next time, and only widen it once that one slice is proven solid.

Third — and this one surprised me. The single biggest lever wasn't which AI model I used,
it was making sure each AI 'team member' had its own instructions written directly into its
own job description, instead of everyone sharing one general handbook they were all
supposed to read. It turns out that's exactly the same lesson this whole project is about:
an assistant — human or AI — only reliably acts on what's actually put directly in front of
it, not on what's merely true somewhere in a shared document nobody's actively looking at.
Fitting, for a project about onboarding."

**[DO]** End on the running app, or the merged PR list — whichever framed better on replay.

---

## Notes for editing

- If a beat runs short, the platform beat (2:15) has room — showing the full `terraform
  apply` output scroll by is good b-roll, don't cut it short in the raw take even if you
  trim it later.
- The traceability-gate demo (delete a row, watch CI go red) is the single most important
  10 seconds in the video, and it's also the easiest one for a non-technical viewer to
  follow with zero explanation — something visibly breaks on screen because a rule was
  broken. If anything gets re-shot, it's not that.
- If a live technical question comes up that the plain-language version doesn't fully
  answer, the bracketed *(Technical: ...)* lines in the gotchas section are there to
  read verbatim — they're accurate enough to satisfy someone who'll recognize the terms.
- Decision log entries worth reading verbatim on camera if a gotcha needs more precision
  than memory gives you, in rough order of how well they demo: the 2026-09-15 publish.yml
  entry (freshest, most concrete), the 2026-09-14 "CI green checkmarks were misleading"
  entry, the 2026-09-13 traceability-gate redesign entry, the 2026-09-13 sidecar-boundary
  planning entry.
