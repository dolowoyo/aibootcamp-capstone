# TASKS-003 — Stakeholder & coalition map

**Implements:** PLAN-003 / SPEC-003
**Executed via:** `executing-plans` skill

- [ ] **Task 1** — Implement `lib/stakeholders/schema.ts` (`RawStakeholderRecord` Zod schema)
      — prerequisite for AC-3.3, AC-3.6, AC-3.7 (the shape check that distinguishes a complete
      record from an incomplete one). Relates to: #14
- [ ] **Task 2** — Implement `lib/stakeholders/classify.ts` (`classifyQuadrant()` with the
      explicit 5.5-midpoint tie-break rule) and
      `lib/stakeholders/quadrant-classification.spec.ts`'s AC-3.1 test — satisfies AC-3.1.
      Relates to: #14
- [ ] **Task 3** — Implement the `QUADRANT_POSTURE` mapping and
      `lib/stakeholders/quadrant-classification.spec.ts`'s AC-3.2 test (each quadrant's
      stakeholders inherit its posture) — satisfies AC-3.2. Relates to: #16
- [ ] **Task 4** — Implement `lib/stakeholders/mcp-client.ts` (`fetchStakeholders()` wrapping
      `list_meetings`/`search_people`/`get_reporting_chain` against
      `fixtures/synthetic-org.json` in fixture mode) — prerequisite for AC-3.3, AC-3.6, AC-3.7.
      Relates to: #15
- [ ] **Task 5** — Implement `lib/stakeholders/map.ts`'s `buildStakeholderMap()` for the
      "fully available" path and `lib/stakeholders/mcp-population.spec.ts`'s AC-3.3 test —
      satisfies AC-3.3. Relates to: #15
- [ ] **Task 6** — Implement `buildStakeholderMap()`'s handling of `McpFetchResult.status ===
      "unavailable"` (empty map + notice) and its AC-3.6 test — satisfies AC-3.6. Relates to:
      #15
- [ ] **Task 7** — Implement `buildStakeholderMap()`'s handling of
      `McpFetchResult.status === "partial"` (incomplete records excluded + skipped-count
      notice) and its AC-3.7 test — satisfies AC-3.7. Relates to: #15
- [ ] **Task 8** — Implement `addStakeholder()`/`repositionStakeholder()`
      (`lib/stakeholders/map.ts`) and `lib/stakeholders/editing.spec.ts`'s AC-3.4/AC-3.5 tests
      — satisfies AC-3.4, AC-3.5. Relates to: #17

## Sequencing notes

Task 1 (schema) blocks Tasks 4-7. Task 2 (classification) blocks Task 3 (posture) and Tasks
5-8 (map building assigns a quadrant to every stakeholder). Task 4 (MCP client) blocks Tasks
5, 6, 7. Task 8 (manual add/reposition) can start once Task 2's `classifyQuadrant()` exists,
independent of Tasks 4-7's MCP-population path — a manually added stakeholder never goes
through `fetchStakeholders()`.
