import type { InferenceProvider } from "../provider";
import { ProviderConfigurationError } from "../errors";
import { starsDiagnosisSchema, type StarsDiagnosis } from "../schemas/stars-diagnosis";
import { milestoneSchema, type Milestone } from "../schemas/plan";
import { validateAgainstSchema } from "../validate";

/**
 * The minimal shape this adapter needs from a real Anthropic client. Injectable so the
 * cross-adapter conformance harness (SPEC-000 AC-0.1) can exercise this adapter against a
 * mocked SDK boundary, per SPEC-000's Out of Scope — no live Anthropic API call is made or
 * tested anywhere in this repo, since no key exists to exercise one (ADR-0001).
 */
export interface AnthropicLikeClient {
  diagnoseStars(intake: unknown): Promise<unknown>;
  generatePlan(diagnosis: unknown): Promise<unknown>;
}

/**
 * Written but unwired (ADR-0001, PLAN-000): demonstrates the provider interface's
 * portability to a real Anthropic-backed adapter without requiring a live API key for this
 * capstone. `ANTHROPIC_API_KEY` is checked synchronously in the constructor — a missing key
 * fails fast at construction time (AC-0.9), never on first call.
 */
export class AnthropicProvider implements InferenceProvider {
  private readonly client?: AnthropicLikeClient;

  constructor(env: NodeJS.ProcessEnv = process.env, injectedClient?: AnthropicLikeClient) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new ProviderConfigurationError(
        "LLM_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set"
      );
    }
    this.client = injectedClient;
  }

  async diagnoseStars(intake: unknown): Promise<StarsDiagnosis> {
    const raw = await this.requireClient().diagnoseStars(intake);
    return validateAgainstSchema(starsDiagnosisSchema, raw);
  }

  async generatePlan(diagnosis: unknown): Promise<Milestone[]> {
    const raw = await this.requireClient().generatePlan(diagnosis);
    const list = Array.isArray(raw) ? raw : [];
    return list.map((m) => validateAgainstSchema(milestoneSchema, m));
  }

  private requireClient(): AnthropicLikeClient {
    if (!this.client) {
      throw new ProviderConfigurationError(
        "The anthropic adapter is written but unwired — no live Anthropic client is configured for this capstone (see docs/adr/0001-inference-boundary.md)."
      );
    }
    return this.client;
  }
}
