/**
 * Wraps the Claude Agent SDK's query() with a bounded timeout and json_schema structured
 * output, per docs/adr/0001-inference-boundary.md ("The sidecar's query() call uses
 * outputFormat: { type: 'json_schema', schema } so the STARS diagnosis returns validated JSON
 * directly rather than prose that needs to be regex-parsed") and PLAN-000's environment
 * contract (30s timeout).
 *
 * `queryFn` is injectable so this module is testable without a live Agent SDK call (no
 * `claude` CLI / keychain in CI or containers -- see ADR-0001). Production code omits it and
 * gets the real SDK's `query`.
 */

import { query as sdkQuery } from "@anthropic-ai/claude-agent-sdk";

// A minimal shape of the SDK's result message -- only the fields this module reads. Kept
// narrow deliberately rather than importing the SDK's full (large) SDKMessage union.
interface AgentResultMessage {
  type: "result";
  subtype: string;
  is_error?: boolean;
  structured_output?: unknown;
  result?: string;
  errors?: string[];
}

type AgentMessage = AgentResultMessage | { type: string; [key: string]: unknown };

export type QueryFn = (params: {
  prompt: string;
  options?: Record<string, unknown>;
}) => AsyncGenerator<AgentMessage, void> | AsyncIterable<AgentMessage>;

const defaultQueryFn: QueryFn = (params) =>
  sdkQuery(params as Parameters<typeof sdkQuery>[0]) as unknown as AsyncGenerator<
    AgentMessage,
    void
  >;

export class AgentQueryError extends Error {
  readonly code = "AGENT_QUERY_ERROR";
}

export class AgentTimeoutError extends Error {
  readonly code = "AGENT_TIMEOUT";
}

export interface RunStructuredQueryParams {
  prompt: string;
  schema: Record<string, unknown>;
  /** Defaults to 30s per PLAN-000's environment contract. */
  timeoutMs?: number;
  /** Injectable for tests; defaults to the real Agent SDK's query(). */
  queryFn?: QueryFn;
}

const DEFAULT_TIMEOUT_MS = 30_000;

function isResultMessage(message: AgentMessage): message is AgentResultMessage {
  return message.type === "result";
}

function describeFailedResult(message: AgentResultMessage): string {
  if (Array.isArray(message.errors) && message.errors.length > 0) {
    return message.errors.join("; ");
  }
  if (typeof message.result === "string" && message.result.length > 0) {
    return message.result;
  }
  return `Agent SDK query ended with subtype "${message.subtype}"`;
}

/**
 * Runs a single Agent SDK query, enforcing `timeoutMs` (default 30s) and resolving to the
 * structured_output payload of the turn's terminal `result` message. Rejects with
 * AgentQueryError for any failure that isn't a timeout (error result, missing
 * structured_output, or a stream that ends without ever emitting a result), and with
 * AgentTimeoutError when no result arrives within the timeout -- these are the only two
 * failure modes the sidecar's HTTP layer needs to distinguish (see server.ts).
 */
export async function runStructuredQuery({
  prompt,
  schema,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  queryFn = defaultQueryFn,
}: RunStructuredQueryParams): Promise<unknown> {
  const generator = queryFn({
    prompt,
    options: { outputFormat: { type: "json_schema", schema } },
  });

  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new AgentTimeoutError(`Agent SDK query exceeded ${timeoutMs}ms timeout`));
    }, timeoutMs);
  });

  const run = (async () => {
    for await (const message of generator) {
      if (!isResultMessage(message)) continue;
      if (message.subtype === "success" && !message.is_error) {
        if (message.structured_output === undefined) {
          throw new AgentQueryError("Agent SDK query completed without structured_output");
        }
        return message.structured_output;
      }
      throw new AgentQueryError(describeFailedResult(message));
    }
    throw new AgentQueryError("Agent SDK query stream ended without a result message");
  })();

  try {
    return await Promise.race([run, timeout]);
  } finally {
    clearTimeout(timeoutHandle);
    const closable = generator as { close?: () => void };
    if (typeof closable.close === "function") {
      try {
        closable.close();
      } catch {
        // best-effort cleanup only -- a close() failure shouldn't mask the real result/error
      }
    }
  }
}
