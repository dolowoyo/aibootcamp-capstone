import type { InferenceProvider } from "./provider";
import { FixtureProvider } from "./adapters/fixture";
import { SidecarProvider } from "./adapters/sidecar";
import { AnthropicProvider } from "./adapters/anthropic";

export type ProviderKind = "fixture" | "sidecar" | "anthropic";

/**
 * A lookup table with `fixture` as the explicit fallback for any key miss, per PLAN-000 —
 * not an if/else chain that could silently diverge from the AC-0.7/AC-0.8 guarantee as more
 * adapters are added.
 */
const ADAPTER_FACTORY: Record<ProviderKind, (env: NodeJS.ProcessEnv) => InferenceProvider> = {
  fixture: () => new FixtureProvider(),
  sidecar: (env) => new SidecarProvider(env),
  anthropic: (env) => new AnthropicProvider(env),
};

/**
 * Resolves an arbitrary `LLM_PROVIDER` env value to one of the three known adapter kinds.
 * Unset (AC-0.7) or any value that isn't exactly `sidecar`/`anthropic` (AC-0.8) resolves to
 * `fixture` — never an error, never a silent live-inference default.
 */
export function resolveProviderKind(envValue: string | undefined): ProviderKind {
  if (envValue === "sidecar" || envValue === "anthropic") return envValue;
  return "fixture";
}

export function createProvider(env: NodeJS.ProcessEnv = process.env): InferenceProvider {
  const kind = resolveProviderKind(env.LLM_PROVIDER);
  return ADAPTER_FACTORY[kind](env);
}
