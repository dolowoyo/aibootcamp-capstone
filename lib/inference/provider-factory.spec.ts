import { describe, expect, it } from "vitest";
import { createProvider } from "./provider-factory";
import { FixtureProvider } from "./adapters/fixture";
import { SidecarProvider } from "./adapters/sidecar";
import { AnthropicProvider } from "./adapters/anthropic";
import { ProviderConfigurationError } from "./errors";

describe("adapter selection", () => {
  it("LLM_PROVIDER of fixture, sidecar, or anthropic routes calls to the matching adapter only", () => {
    const fixtureProvider = createProvider({ LLM_PROVIDER: "fixture" } as unknown as NodeJS.ProcessEnv);
    expect(fixtureProvider).toBeInstanceOf(FixtureProvider);
    expect(fixtureProvider).not.toBeInstanceOf(SidecarProvider);
    expect(fixtureProvider).not.toBeInstanceOf(AnthropicProvider);

    const sidecarProvider = createProvider({ LLM_PROVIDER: "sidecar" } as unknown as NodeJS.ProcessEnv);
    expect(sidecarProvider).toBeInstanceOf(SidecarProvider);
    expect(sidecarProvider).not.toBeInstanceOf(FixtureProvider);
    expect(sidecarProvider).not.toBeInstanceOf(AnthropicProvider);

    const anthropicProvider = createProvider({
      LLM_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: "test-key",
    } as unknown as NodeJS.ProcessEnv);
    expect(anthropicProvider).toBeInstanceOf(AnthropicProvider);
    expect(anthropicProvider).not.toBeInstanceOf(FixtureProvider);
    expect(anthropicProvider).not.toBeInstanceOf(SidecarProvider);
  });

  it("an unset LLM_PROVIDER constructs the fixture adapter", () => {
    const provider = createProvider({} as unknown as NodeJS.ProcessEnv);
    expect(provider).toBeInstanceOf(FixtureProvider);
  });

  it("an invalid LLM_PROVIDER value constructs the fixture adapter rather than throwing or defaulting to a live provider", () => {
    const provider = createProvider({ LLM_PROVIDER: "totally-not-a-real-adapter" } as unknown as NodeJS.ProcessEnv);
    expect(provider).toBeInstanceOf(FixtureProvider);
  });

  it("selecting anthropic without ANTHROPIC_API_KEY set throws ProviderConfigurationError at construction time", () => {
    expect(() => createProvider({ LLM_PROVIDER: "anthropic" } as unknown as NodeJS.ProcessEnv)).toThrow(
      ProviderConfigurationError
    );
  });
});
