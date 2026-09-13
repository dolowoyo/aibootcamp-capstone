/**
 * Wires the pure tool/resource handlers (tools.ts, resources.ts) into an
 * @modelcontextprotocol/sdk McpServer, per docs/mcp-tool-contract.md. This module is
 * intentionally thin -- all decision logic lives in tools.ts/resources.ts and is unit-tested
 * there directly; this file only does SDK registration, which mirrors the SDK's own tested
 * behavior rather than reimplementing it.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadOrgFixture } from "./fixture-store.js";
import { readCalendarWeek, readOrgDirectory } from "./resources.js";
import { getReportingChain, listMeetings, searchPeople } from "./tools.js";
import type { OrgFixture } from "./types.js";

export function createServer(fixture: OrgFixture = loadOrgFixture()): McpServer {
  const server = new McpServer({
    name: "onboarding-context",
    version: "0.1.0",
  });

  server.registerTool(
    "list_meetings",
    {
      title: "List meetings",
      description:
        "Meetings in a given week, used to derive an interaction-frequency signal (a component of influence).",
      inputSchema: {
        weekOffset: z
          .number()
          .int()
          .describe("0 = current week, negative = past weeks (e.g. -12 = ~90 days ago)"),
      },
    },
    async ({ weekOffset }) => {
      const result = listMeetings(fixture, { weekOffset });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    "search_people",
    {
      title: "Search people",
      description: "The org directory. Empty query returns everyone.",
      inputSchema: {
        query: z.string().describe("Search term matched against name, title, or department"),
      },
    },
    async ({ query }) => {
      const result = searchPeople(fixture, { query });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    "get_reporting_chain",
    {
      title: "Get reporting chain",
      description:
        "A person's management chain, used as a component of influence (proximity to the leader's own chain of command).",
      inputSchema: {
        personId: z.string(),
      },
    },
    async ({ personId }) => {
      const result = getReportingChain(fixture, { personId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    },
  );

  server.registerResource(
    "org-directory",
    "org://directory",
    {
      title: "Org directory",
      description: "Full org directory snapshot (fabricated data).",
      mimeType: "application/json",
    },
    async (uri) => {
      const result = readOrgDirectory(fixture);
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerResource(
    "calendar-week",
    new ResourceTemplate("calendar://week/{n}", { list: undefined }),
    {
      title: "Calendar week",
      description: "A given week's meetings (fabricated data).",
      mimeType: "application/json",
    },
    async (uri, { n }) => {
      const weekOffset = Number(Array.isArray(n) ? n[0] : n);
      const result = readCalendarWeek(fixture, weekOffset);
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(result) }],
      };
    },
  );

  return server;
}
