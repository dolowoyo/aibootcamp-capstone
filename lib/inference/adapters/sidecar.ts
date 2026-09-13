import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { InferenceProvider } from "../provider";
import { ProviderUnavailableError } from "../errors";
import { starsDiagnosisSchema, type StarsDiagnosis } from "../schemas/stars-diagnosis";
import { milestoneSchema, type Milestone } from "../schemas/plan";
import { validateAgainstSchema } from "../validate";

/** Resolves SPEC-000's open question on timeout duration (PLAN-000): 30s. */
const DEFAULT_TIMEOUT_MS = 30_000;

const milestoneListSchema = z.array(milestoneSchema);

export interface SidecarProviderOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Thin HTTP client to `services/inference-sidecar` (ADR-0001) — the host-side process that
 * owns the Agent SDK.
 *
 * Wire contract (reconciled 2026-09-13 against `services/inference-sidecar/README.md`,
 * built in a parallel worktree — see that doc for the authoritative version):
 *
 *   POST /diagnose | POST /plan
 *   request:  { prompt: string, schema: <JSON Schema object> }
 *   response: 200 { result: <object matching schema> }
 *             400 { error: "invalid_request" | "invalid_json", message }
 *             502 { error: "agent_error", message }  -- Agent SDK turn errored
 *             504 { error: "timeout", message }       -- no result within 30s
 *
 * The sidecar process is deliberately domain-ignorant — it doesn't know about
 * `StarsDiagnosis` or the milestone schema. This adapter builds both the prompt and the JSON
 * Schema for whichever operation it's calling and sends them as the request body; the
 * sidecar just runs the Agent SDK's `query()` against that schema and hands back
 * `structured_output`.
 *
 * Every failure mode — a non-2xx response (400/502/504 alike), connection refused, or a
 * network error — maps uniformly to `ProviderUnavailableError` (AC-0.10). The sidecar
 * doesn't distinguish "model failed" from "model was slow" from "not running", and neither
 * does this adapter's caller-facing error (AC-0.11: callers discriminate by error type only).
 * A 400 in practice means a bug in this adapter's own request-building, not a runtime
 * condition to special-case — it still surfaces the same way, since SPEC-000's AC-0.10 does
 * not carve out a separate outcome for it.
 */
export class SidecarProvider implements InferenceProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(env: NodeJS.ProcessEnv = process.env, options: SidecarProviderOptions = {}) {
    this.baseUrl = env.INFERENCE_SIDECAR_URL ?? "http://host.docker.internal:8787";
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async diagnoseStars(intake: unknown): Promise<StarsDiagnosis> {
    const prompt = buildDiagnosePrompt(intake);
    const schema = zodToJsonSchema(starsDiagnosisSchema, "StarsDiagnosis");
    const result = await this.callSidecar("/diagnose", prompt, schema);
    return validateAgainstSchema(starsDiagnosisSchema, result);
  }

  async generatePlan(diagnosis: unknown): Promise<Milestone[]> {
    const prompt = buildPlanPrompt(diagnosis);
    const schema = zodToJsonSchema(milestoneListSchema, "Milestones");
    const result = await this.callSidecar("/plan", prompt, schema);
    return validateAgainstSchema(milestoneListSchema, result);
  }

  private async callSidecar(path: string, prompt: string, schema: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let response: Response;
      try {
        response = await this.fetchImpl(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt, schema }),
          signal: controller.signal,
        });
      } catch (err) {
        // Connection refused, DNS failure, abort/timeout — never re-thrown directly (AC-0.11).
        throw new ProviderUnavailableError(
          `Sidecar request to ${path} failed: ${(err as Error)?.message ?? String(err)}`,
          err
        );
      }

      if (!response.ok) {
        // Covers 400 (invalid_request/invalid_json), 502 (agent_error), and 504 (timeout)
        // alike — all collapse to ProviderUnavailableError, per this module's doc comment.
        let message = `Sidecar responded to ${path} with non-2xx status ${response.status}`;
        try {
          const body = (await response.json()) as { error?: string; message?: string };
          if (body?.message) message = `${message}: ${body.message}`;
        } catch {
          // Non-JSON error body — fall back to the status-only message above.
        }
        throw new ProviderUnavailableError(message);
      }

      const body = (await response.json()) as { result?: unknown };
      return body.result;
    } finally {
      clearTimeout(timer);
    }
  }
}

function buildDiagnosePrompt(intake: unknown): string {
  const narrative =
    typeof intake === "object" && intake !== null && "narrative" in intake
      ? String((intake as { narrative?: unknown }).narrative ?? "")
      : JSON.stringify(intake);
  return [
    "You are diagnosing a new leader's situation using Michael Watkins' STARS model",
    "(Startup, Turnaround, Accelerated Growth, Realignment, Sustaining Success).",
    "Given the narrative below, return a structured diagnosis with a dominant type, an",
    "optional secondary type, a confidence level, a rationale grounded in the narrative's",
    "own language, and evidence excerpts that are literal substrings of it.",
    "",
    "Narrative:",
    narrative,
  ].join("\n");
}

function buildPlanPrompt(diagnosis: unknown): string {
  return [
    "You are generating a situation-aware 30/60/90-day milestone plan for a new leader.",
    "Their STARS diagnosis (JSON) is below. Return milestones grouped across Days 1-30,",
    "Days 31-60, and Days 61-90, each with a rationale referencing the situation type.",
    "",
    "Diagnosis:",
    JSON.stringify(diagnosis),
  ].join("\n");
}
