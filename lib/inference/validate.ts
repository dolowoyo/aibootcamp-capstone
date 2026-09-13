import type { ZodType } from "zod";
import { SchemaValidationError } from "./errors";

/**
 * The single enforcement point every adapter routes its raw response through before handing
 * it to a caller (SPEC-000 AC-0.2, AC-0.3). Returns the parsed, typed value on success; throws
 * `SchemaValidationError` on failure — never returns a malformed value.
 */
export function validateAgainstSchema<T>(schema: ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new SchemaValidationError(
      `Schema validation failed: ${result.error.message}`,
      result.error
    );
  }
  return result.data;
}
