---
description: Reconstruct where the capstone project stands after a context clear, crash, or new session — the first command to run in any new session
---

Run this before touching anything else in a new session. Its job is to tell you where things
actually stand, reconciled against live GitHub/git state — not just to repeat back a file.

## Steps

1. Read, in order:
   - `docs/constitution.md` (principles — don't re-derive these, just internalize them)
   - `docs/STATE.md` (the last checkpoint's snapshot)
   - The active spec(s) named in `STATE.md`'s "Active specs" line, under `docs/specs/`
   - `docs/decision-log.md`'s last 3-5 entries (recent context, not the whole history)

2. **Reconcile against live state** — do not trust `STATE.md` blindly:
   - `git worktree list` — does it match what STATE.md's "In flight" section describes?
   - `git status --short` in each active worktree — any uncommitted work STATE.md doesn't mention?
   - `gh issue list --state all --json number,title,state,labels` — compare against
     STATE.md's task references
   - `gh pr list --state all --json number,title,state,mergedAt` — same
   - `gh run list --limit 5 --json status,conclusion` — is CI green on `main`?

3. **If STATE.md and live state disagree, say so explicitly and prefer the live state.**
   A stale snapshot that's quietly wrong is worse than no snapshot. Don't silently
   correct it — report it, then act on the truth.

4. Report back in this shape, before doing anything else:

   ```
   ## Where things stand
   Block: <N> — <name>
   <2-3 sentences: what's actually done, what's actually in flight>

   ## Discrepancies found
   <none, or exactly what disagreed and which source you trusted and why>

   ## Recommended next action
   <one concrete next step, referencing the spec/task/issue it serves>
   ```

5. Wait for confirmation before acting, unless the next step is unambiguous and low-risk
   (e.g. resuming a `builder` task already mid-flight in an existing worktree with no
   open questions).

## Rules

- This command reads and reports. It does not write code, open PRs, or modify STATE.md —
  that's `/checkpoint`'s job, run afterward once real progress has happened.
- If `docs/STATE.md` doesn't exist yet, say so plainly and suggest running `/checkpoint`
  once there's something to snapshot — don't fabricate a state.
