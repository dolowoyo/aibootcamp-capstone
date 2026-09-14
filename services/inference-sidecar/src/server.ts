/**
 * HTTP server for the inference sidecar (docs/adr/0001-inference-boundary.md). Exposes
 * POST /diagnose and POST /plan -- the wire contract the app's `lib/inference/adapters/
 * sidecar.ts` HTTP client calls. See ../README.md for the full contract: this repo has no
 * shared contract doc for the sidecar wire shape analogous to docs/mcp-tool-contract.md, so
 * that README is the single source of truth for it and should be reconciled with the actual
 * adapter if the two drift.
 *
 * Plain node:http rather than a framework -- this is two routes and no middleware, so a
 * dependency isn't earning its keep here.
 */

import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Server } from "node:http";
import { AgentQueryError, AgentTimeoutError, runStructuredQuery } from "./agent-query.js";
import type { QueryFn } from "./agent-query.js";

export interface SidecarServerOptions {
  /** Injectable for tests; defaults to the real Agent SDK's query() inside agent-query.ts. */
  queryFn?: QueryFn;
  /**
   * Overrides the timeout for every route uniformly (used by tests). When omitted, each route
   * gets its own default: /diagnose uses agent-query.ts's own 30s default, /plan uses
   * PLAN_TIMEOUT_MS below. Split after a live Block 3 run found generatePlan's real latency
   * (a full 3-phase milestone plan, heavier than a single diagnosis) consistently exceeded a
   * shared 30s budget -- confirmed with Dele: only /plan's budget moves, /diagnose keeps 30s
   * so the demo's diagnosis path stays legible on camera per PLAN-000's original tradeoff.
   */
  timeoutMs?: number;
}

/** /plan's own server-side budget -- see SidecarServerOptions.timeoutMs's doc comment. */
const PLAN_TIMEOUT_MS = 60_000;

const ROUTES = new Set(["/diagnose", "/plan"]);

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
  res.end(payload);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (raw.trim() === "") return {};
  return JSON.parse(raw);
}

function isRequestBody(value: unknown): value is { prompt: string; schema: Record<string, unknown> } {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.prompt === "string" &&
    typeof candidate.schema === "object" &&
    candidate.schema !== null
  );
}

export function createServer(options: SidecarServerOptions = {}): Server {
  return createHttpServer(async (req, res) => {
    const url = req.url ?? "";

    if (req.method !== "POST" || !ROUTES.has(url)) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "invalid_json", message: "request body must be valid JSON" });
      return;
    }

    if (!isRequestBody(body)) {
      sendJson(res, 400, {
        error: "invalid_request",
        message: "request body must be { prompt: string, schema: object }",
      });
      return;
    }

    try {
      const result = await runStructuredQuery({
        prompt: body.prompt,
        schema: body.schema,
        timeoutMs: options.timeoutMs ?? (url === "/plan" ? PLAN_TIMEOUT_MS : undefined),
        queryFn: options.queryFn,
      });
      sendJson(res, 200, { result });
    } catch (error) {
      if (error instanceof AgentTimeoutError) {
        sendJson(res, 504, { error: "timeout", message: error.message });
        return;
      }
      if (error instanceof AgentQueryError) {
        sendJson(res, 502, { error: "agent_error", message: error.message });
        return;
      }
      sendJson(res, 500, {
        error: "internal_error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
