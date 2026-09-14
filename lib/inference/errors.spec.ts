import { describe, expect, it } from "vitest";
import {
  ProviderConfigurationError,
  ProviderUnavailableError,
  SchemaValidationError,
} from "./errors";

describe("error distinguishability", () => {
  it("SchemaValidationError, ProviderUnavailableError, and ProviderConfigurationError are distinguishable by type without parsing the error message", () => {
    const errors: unknown[] = [
      new SchemaValidationError("bad shape"),
      new ProviderUnavailableError("connection refused"),
      new ProviderConfigurationError("missing key"),
    ];

    const codes = errors.map((e) => (e as { code: string }).code);
    expect(new Set(codes).size).toBe(3);

    expect(errors[0]).toBeInstanceOf(SchemaValidationError);
    expect(errors[0]).not.toBeInstanceOf(ProviderUnavailableError);
    expect(errors[0]).not.toBeInstanceOf(ProviderConfigurationError);
    expect((errors[0] as SchemaValidationError).code).toBe("SCHEMA_VALIDATION");

    expect(errors[1]).toBeInstanceOf(ProviderUnavailableError);
    expect(errors[1]).not.toBeInstanceOf(SchemaValidationError);
    expect(errors[1]).not.toBeInstanceOf(ProviderConfigurationError);
    expect((errors[1] as ProviderUnavailableError).code).toBe("PROVIDER_UNAVAILABLE");

    expect(errors[2]).toBeInstanceOf(ProviderConfigurationError);
    expect(errors[2]).not.toBeInstanceOf(SchemaValidationError);
    expect(errors[2]).not.toBeInstanceOf(ProviderUnavailableError);
    expect((errors[2] as ProviderConfigurationError).code).toBe("PROVIDER_CONFIGURATION");
  });
});
