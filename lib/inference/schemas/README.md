# `lib/inference/schemas/` — schema module contract

Per PLAN-000 (Task 8): this directory holds the Zod schema modules for every shape that
crosses the inference provider boundary. PLAN-000 establishes *where* these modules live and
the contract they follow; it does not define field contents — those are owned by the spec
that needs the shape (SPEC-001 → `stars-diagnosis.ts`, SPEC-002 → `plan.ts`).

Every schema module in this directory follows the same shape:

```ts
import { z, type ZodType } from "zod";

export const fooSchema: ZodType<Foo> = z.object({ ... });
export type Foo = z.infer<typeof fooSchema>;
```

`lib/inference/validate.ts`'s `validateAgainstSchema<T>(schema, raw)` is the single point every
adapter routes a raw response through before handing it to a caller (AC-0.2, AC-0.3) — no
adapter validates independently.

Modules in this directory:

- `stars-diagnosis.ts` — SPEC-001's `StarsDiagnosis` shape.
- `plan.ts` — SPEC-002's `Plan`/`Milestone` shape.
