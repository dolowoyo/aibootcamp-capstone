---
description: Rewrite docs/STATE.md from live git/gh signals and commit it, appending any new decisions to decision-log.md
---

Run this at every phase boundary, before any risky operation, and before stepping away from
the project.

## Steps

1. **Gather live signals:**
   - `git status --short` and `git branch -a` in the main worktree
   - `git worktree list` — every active worktree and its branch
   - For each active worktree: `git -C <path> status --short` and `git -C <path> log --oneline -5`
   - `gh issue list --state open --json number,title,labels,milestone`
   - `gh pr list --state open --json number,title,headRefName,statusCheckRollup,reviewDecision`
   - `gh run list --limit 5 --json status,conclusion,workflowName`

2. **Rewrite `docs/STATE.md` completely** (overwrite, don't append) using this shape:

   ```markdown
   # Current State — updated <ISO timestamp>
   Block: <N> (<name>)
   Active specs: <SPEC-00N status for each> ✅merged / 🔨in progress / ⏸cut to backlog

   ## In flight
   - <worktree>  <agent>  <what's done · what's next, in one line each>

   ## Next 3 actions
   1. ...
   2. ...
   3. ...

   ## Blockers / open decisions
   - <anything stuck, with enough context to unstick it cold>

   ## Do not forget
   - <anything time-sensitive or easy to lose — e.g. "recording is running">
   ```

3. **If anything happened since the last checkpoint that a future reader would need
   explained** (a scope cut, an overridden agent, a spec amendment, an architectural
   call) — append an entry to `docs/decision-log.md` using its documented format.
   Do not touch past entries. If nothing decision-worthy happened, skip this step.

4. **Commit both files together:**
   ```
   git add docs/STATE.md docs/decision-log.md
   git commit -m "chore: checkpoint — <one-line summary of where things stand>"
   ```

5. Report back in 3-5 lines: what changed since the last checkpoint, and what's next.

## Rules

- `STATE.md` is a snapshot, not a log — old content is replaced, not preserved.
- Don't editorialize in `STATE.md`. Facts and next actions only.
- If GitHub state and your best guess disagree, trust GitHub and note the discrepancy
  rather than silently picking one.
