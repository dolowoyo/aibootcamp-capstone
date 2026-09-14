/**
 * Shared error hierarchy for the inference provider boundary (SPEC-000, PLAN-000).
 *
 * A caller discriminates on `.code` (or `instanceof`) alone, never on `.message` text
 * (AC-0.11). Centralized here — not per-adapter — so that guarantee holds by construction
 * rather than by each adapter remembering to reconcile its own error type.
 */

export class SchemaValidationError extends Error {
  readonly code = "SCHEMA_VALIDATION" as const;

  constructor(message: string, readonly cause_?: unknown) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

export class ProviderUnavailableError extends Error {
  readonly code = "PROVIDER_UNAVAILABLE" as const;

  constructor(message: string, readonly cause_?: unknown) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export class ProviderConfigurationError extends Error {
  readonly code = "PROVIDER_CONFIGURATION" as const;

  constructor(message: string, readonly cause_?: unknown) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}
