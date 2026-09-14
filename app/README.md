# First 90 — app

Next.js 15 (App Router) + TypeScript + Tailwind + Prisma. This workspace hosts the UI and API
routes; the domain logic it's built on lives in the repo-root `lib/` directory (see below for
why) and is what the traceability-checked tests in `docs/specs/SPEC-00N-*.md` actually cover.

## Why `lib/` is a sibling of `app/`, not nested inside it

`docs/tasks/TASKS-00N-*.md`'s traceability tables name test paths like
`lib/inference/provider.contract.spec.ts`, resolved by `scripts/check-traceability.ts`
relative to the **repo root**. So the tested domain modules and their specs live at
`<repo-root>/lib/`, not `<repo-root>/app/lib/`. `app/vitest.config.ts` and `app/tsconfig.json`
(`@lib/*` path alias) bridge across that boundary so `npm test`/`npm run typecheck` (run with
this workspace as cwd) still pick up and check the repo-root `lib/` tree.

## Scripts

- `npm run dev` — local dev server
- `npm run lint` — ESLint (repo-root config; also lints repo-root `lib/`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` — Vitest (`LLM_PROVIDER=fixture` always — see `docs/adr/0002-fixture-first-testing.md`)
- `npm run test:e2e` — Playwright; currently a thin smoke test (`/api/healthz` returns 200).
  The full intake -> diagnosis -> plan -> stakeholder-map journey e2e test is Block 3's job.
- `npm run build` — `next build`

See `ENVIRONMENT.md` for the environment variables the app reads.

## What's deliberately simple here

This build prioritizes the library layer and its tests (what the spec ACs actually gate) over
UI polish, per this build's explicit scope. The UI pages (`/diagnosis`, `/plan`,
`/stakeholders`) wire the tested `lib/` functions together using Next.js Server Actions and a
single in-memory, single-process store (`app/_lib/store.ts`) rather than the Prisma-backed
persistence layer `prisma/schema.prisma` and `lib/plan/repository.ts`'s `PrismaPlanClient`
already define — swapping the UI to that real persistence layer is a follow-up, not a change
to the tested domain contract.

The stakeholder map starts from an "unavailable" MCP result, since `mcp/onboarding-context` is
a different worktree's deliverable not yet wired here — this honestly exercises AC-3.6's
graceful-degradation path (empty map, visible notice, manual add still works) until
integration.
