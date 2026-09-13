## Implements

<!-- Required. Name the spec and exactly the ACs this PR satisfies — no more, no fewer. -->
Implements: SPEC-00N (AC-N.M, AC-N.K)

## What changed

<!-- Brief description of the change. -->

## Verification

- [ ] `npm run check:traceability` passes locally
- [ ] All tests named in the traceability table for the ACs above exist and pass
- [ ] `verification-before-completion` was run before opening this PR (see CLAUDE.md)
- [ ] No client/Slalom data, real names, or real statistics anywhere in this diff
- [ ] If this touches `lib/inference/`: tests use `LLM_PROVIDER=fixture`, never live inference

## Notes for reviewer

<!-- Anything the reviewer should know: tradeoffs made, things deliberately left out, etc. -->
