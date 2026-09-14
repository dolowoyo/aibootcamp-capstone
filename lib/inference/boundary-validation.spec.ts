import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validateAgainstSchema } from "./validate";
import { SchemaValidationError } from "./errors";

const personSchema = z.object({
  name: z.string(),
  age: z.number(),
});

describe("schema validation at the boundary", () => {
  it("a well-formed adapter payload is returned to the caller only after passing schema validation", () => {
    const raw = { name: "Ada", age: 30 };
    const result = validateAgainstSchema(personSchema, raw);
    expect(result).toEqual({ name: "Ada", age: 30 });
  });

  it("a malformed adapter payload is rejected with SchemaValidationError instead of being returned", () => {
    const raw = { name: "Ada" }; // missing required `age`
    expect(() => validateAgainstSchema(personSchema, raw)).toThrow(SchemaValidationError);
  });
});
