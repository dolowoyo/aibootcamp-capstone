import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { OrgFixture } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// This package lives at mcp/onboarding-context/{src,dist}/ -- the fixture is committed at the
// repo root per docs/constitution.md principle VII ("every persona ... lives in fixtures/").
const DEFAULT_FIXTURE_PATH = join(__dirname, "..", "..", "..", "fixtures", "synthetic-org.json");

let cached: OrgFixture | undefined;

/**
 * Loads fixtures/synthetic-org.json from disk. Cached after first read -- this is static
 * fixture data (constitution principle VII), not something that changes at runtime.
 */
export function loadOrgFixture(path: string = DEFAULT_FIXTURE_PATH): OrgFixture {
  if (cached && path === DEFAULT_FIXTURE_PATH) {
    return cached;
  }
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw) as OrgFixture;
  if (path === DEFAULT_FIXTURE_PATH) {
    cached = parsed;
  }
  return parsed;
}
