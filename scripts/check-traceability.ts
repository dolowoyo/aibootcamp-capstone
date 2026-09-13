#!/usr/bin/env tsx
/**
 * check-traceability.ts
 *
 * The hard gate for spec-driven development (see docs/constitution.md, principle II).
 *
 * For every docs/specs/SPEC-*.md (excluding _TEMPLATE.md):
 *   1. Every AC-N.M listed under "## Acceptance criteria" must appear exactly once in the
 *      "## Traceability" table.
 *   2. Every traceability row's Test column (`path/to/file.spec.ts > describe > test name`)
 *      must resolve to a file that exists on disk and contain that test title as a literal
 *      string (a lightweight text check, not a full AST parse — deliberately test-runner
 *      agnostic so this works before vitest/playwright are wired up).
 *   3. No traceability row may reference an AC that doesn't exist in the spec.
 *
 * Exit 0 and a summary on success. Exit 1 with a precise list of violations on failure.
 * Wired into CI as the `traceability` required status check on `main`.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const SPECS_DIR = join(REPO_ROOT, "docs", "specs");

interface Violation {
  spec: string;
  message: string;
}

interface TraceRow {
  ac: string;
  behaviour: string;
  test: string; // "path/to/file.spec.ts > describe > test name"
  line: number;
}

function listSpecFiles(): string[] {
  if (!existsSync(SPECS_DIR)) return [];
  return readdirSync(SPECS_DIR)
    .filter((f) => f.startsWith("SPEC-") && f.endsWith(".md"))
    .map((f) => join(SPECS_DIR, f));
}

function extractSection(content: string, heading: string): string | null {
  const lines = content.split("\n");
  const startIdx = lines.findIndex((l) => l.trim().toLowerCase() === heading.toLowerCase());
  if (startIdx === -1) return null;
  const rest = lines.slice(startIdx + 1);
  const endIdx = rest.findIndex((l) => /^##\s/.test(l));
  return (endIdx === -1 ? rest : rest.slice(0, endIdx)).join("\n");
}

function extractDeclaredACs(content: string): string[] {
  const section = extractSection(content, "## Acceptance criteria");
  if (!section) return [];
  const acs: string[] = [];
  const re = /\bAC-(\d+\.\d+)\b/g;
  for (const line of section.split("\n")) {
    // Only count ACs declared as list items (avoid picking up incidental mentions elsewhere)
    if (!/^\s*-\s*\*\*AC-\d+\.\d+\*\*/.test(line) && !/^\s*-\s*AC-\d+\.\d+/.test(line)) continue;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(line))) acs.push(`AC-${m[1]}`);
  }
  return [...new Set(acs)];
}

function extractTraceabilityRows(content: string, specFile: string): TraceRow[] {
  const section = extractSection(content, "## Traceability");
  if (!section) return [];
  const rows: TraceRow[] = [];
  const lines = content.split("\n");
  const sectionStartLine = lines.findIndex((l) => l.trim().toLowerCase() === "## traceability");

  section.split("\n").forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) return;
    if (/^\|\s*-+\s*\|/.test(trimmed)) return; // separator row
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 3) return;
    const [ac, behaviour, test] = cells;
    if (!/^AC-\d+\.\d+$/.test(ac)) return; // header row or malformed
    rows.push({ ac, behaviour, test, line: sectionStartLine + idx + 1 });
  });
  return rows;
}

function testExistsInFile(filePath: string, testTitle: string): boolean {
  const fullPath = join(REPO_ROOT, filePath);
  if (!existsSync(fullPath)) return false;
  const content = readFileSync(fullPath, "utf-8");
  return content.includes(testTitle);
}

function checkSpec(specPath: string): Violation[] {
  const specName = specPath.split("/").pop()!;
  const content = readFileSync(specPath, "utf-8");
  const violations: Violation[] = [];

  const declaredACs = extractDeclaredACs(content);
  const rows = extractTraceabilityRows(content, specPath);

  if (declaredACs.length === 0) {
    violations.push({
      spec: specName,
      message: `No acceptance criteria found under "## Acceptance criteria". A spec with no ACs cannot be traced.`,
    });
    return violations;
  }

  if (rows.length === 0) {
    violations.push({
      spec: specName,
      message: `No "## Traceability" table found (or it's empty), but ${declaredACs.length} AC(s) are declared.`,
    });
    return violations;
  }

  const tracedACs = new Set(rows.map((r) => r.ac));

  // Every declared AC must have a traceability row
  for (const ac of declaredACs) {
    if (!tracedACs.has(ac)) {
      violations.push({ spec: specName, message: `${ac} is declared but has no traceability row.` });
    }
  }

  // Every traceability row's AC must have been declared (no dangling references)
  for (const row of rows) {
    if (!declaredACs.includes(row.ac)) {
      violations.push({
        spec: specName,
        message: `Traceability row references ${row.ac} (line ${row.line}) which is not declared under "## Acceptance criteria".`,
      });
    }
  }

  // Duplicate AC rows
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.ac)) {
      violations.push({ spec: specName, message: `${row.ac} appears more than once in the traceability table.` });
    }
    seen.add(row.ac);
  }

  // Each row's test must resolve
  for (const row of rows) {
    const parts = row.test.split(">").map((p) => p.trim());
    const filePart = parts[0];
    if (!filePart || filePart.startsWith("<") || filePart === "") {
      violations.push({
        spec: specName,
        message: `${row.ac} (line ${row.line}) has no real test reference: "${row.test}"`,
      });
      continue;
    }
    if (!existsSync(join(REPO_ROOT, filePart))) {
      violations.push({
        spec: specName,
        message: `${row.ac} (line ${row.line}) references "${filePart}" which does not exist on disk.`,
      });
      continue;
    }
    const testTitle = parts[parts.length - 1];
    if (testTitle && !testExistsInFile(filePart, testTitle)) {
      violations.push({
        spec: specName,
        message: `${row.ac} (line ${row.line}) references test "${testTitle}" — not found as literal text in ${filePart}.`,
      });
    }
  }

  return violations;
}

function main() {
  const specFiles = listSpecFiles();

  if (specFiles.length === 0) {
    console.log("check-traceability: no docs/specs/SPEC-*.md files yet — nothing to check. Passing.");
    process.exit(0);
  }

  let allViolations: Violation[] = [];
  let checkedSpecs = 0;

  for (const specPath of specFiles) {
    checkedSpecs++;
    allViolations = allViolations.concat(checkSpec(specPath));
  }

  if (allViolations.length > 0) {
    console.error(`\n❌ check-traceability: ${allViolations.length} violation(s) across ${checkedSpecs} spec(s)\n`);
    for (const v of allViolations) {
      console.error(`  [${v.spec}] ${v.message}`);
    }
    console.error(
      "\nEvery acceptance criterion must map to exactly one existing test (docs/constitution.md, principle II).\n"
    );
    process.exit(1);
  }

  console.log(`✅ check-traceability: ${checkedSpecs} spec(s) checked, all ACs traced to existing tests.`);
  process.exit(0);
}

main();
