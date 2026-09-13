# TASKS-000 — Inference provider contract

**Implements:** PLAN-000 / SPEC-000
**Executed via:** `executing-plans` skill

- [ ] **Task 1** — Implement `lib/inference/errors.ts` (`SchemaValidationError`,
      `ProviderUnavailableError`, `ProviderConfigurationError`, each with a distinct `.code`)
      and `lib/inference/errors.spec.ts` — satisfies AC-0.11
- [ ] **Task 2** — Implement `lib/inference/validate.ts` (`validateAgainstSchema<T>()`) and
      `lib/inference/boundary-validation.spec.ts` — satisfies AC-0.2, AC-0.3
- [ ] **Task 3** — Implement the `lib/inference/provider.ts` interface (`InferenceProvider`,
      `createProvider()`) and `lib/inference/provider.contract.spec.ts` as a shared
      conformance harness run against all three adapters — satisfies AC-0.1
- [ ] **Task 4** — Implement the `fixture` adapter (`lib/inference/adapters/fixture.ts`) plus
      its fixture-loading mechanism, and `lib/inference/adapters/fixture.spec.ts` — satisfies
      AC-0.4, AC-0.5
- [ ] **Task 5** — Implement `lib/inference/provider-factory.ts` (`LLM_PROVIDER` selection
      logic) and `lib/inference/provider-factory.spec.ts` — satisfies AC-0.6, AC-0.7, AC-0.8,
      AC-0.9
- [ ] **Task 6** — Implement the `sidecar` adapter (`lib/inference/adapters/sidecar.ts`, HTTP
      client with a 30s timeout and failure mapping) and
      `lib/inference/adapters/sidecar.spec.ts` against a mocked HTTP boundary — satisfies
      AC-0.10
- [ ] **Task 7** — Implement the `anthropic` adapter (`lib/inference/adapters/anthropic.ts`,
      written but unwired, construction-time key check) and extend Task 3's conformance
      harness to cover it against a mocked SDK boundary — satisfies AC-0.1, AC-0.9
- [ ] **Task 8** — Scaffold `lib/inference/schemas/` as an empty module directory with the
      `SchemaModule<T>` contract documented (no field contents — those are TASKS-001/002's
      deliverables) — prerequisite for Tasks 1-7's schema wiring, no AC of its own
- [ ] **Task 9** — Scaffold `services/inference-sidecar/` (host process skeleton: HTTP server,
      Agent SDK `query()` call stub, 30s timeout enforcement) — supports AC-0.10 end-to-end;
      not independently unit-testable without a live Agent SDK call, verified manually per
      `docs/00-capstone-plan.md`'s verification step 5

## Sequencing notes

Task 8 (schema scaffold) should land before Tasks 3-7, since every adapter's `diagnoseStars`/
`generatePlan` return type references a schema module. Task 1 (errors) should land before
Task 2 (validate.ts throws `SchemaValidationError`) and before Tasks 5-6 (factory/sidecar throw
`ProviderConfigurationError`/`ProviderUnavailableError`). Task 3's conformance harness is
written once but only fully exercises all three adapters once Tasks 4, 6, and 7 all exist —
expect it to start with fixture-only coverage and grow.
