import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { InferenceProvider } from "../provider";
import { starsDiagnosisSchema, type StarsDiagnosis } from "../schemas/stars-diagnosis";
import { milestoneSchema, type Milestone } from "../schemas/plan";
import { validateAgainstSchema } from "../validate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Repo-root fixtures/inference/{stars,plan}/ — three levels up from lib/inference/adapters/.
const STARS_FIXTURES_DIR = join(__dirname, "..", "..", "..", "fixtures", "inference", "stars");
const PLAN_FIXTURES_DIR = join(__dirname, "..", "..", "..", "fixtures", "inference", "plan");

interface StarsFixtureFile {
  scenarioId: string;
  narrative: string;
  diagnosis: StarsDiagnosis;
}

interface PlanFixtureFile {
  scenarioId: string;
  milestones: Milestone[];
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function loadStarsFixtures(): StarsFixtureFile[] {
  return readdirSync(STARS_FIXTURES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJsonFile<StarsFixtureFile>(join(STARS_FIXTURES_DIR, f)));
}

function loadPlanFixtures(): Record<string, PlanFixtureFile> {
  const out: Record<string, PlanFixtureFile> = {};
  for (const f of readdirSync(PLAN_FIXTURES_DIR).filter((f) => f.endsWith(".json"))) {
    const data = readJsonFile<PlanFixtureFile>(join(PLAN_FIXTURES_DIR, f));
    out[data.scenarioId] = data;
  }
  return out;
}

/**
 * Deterministic scenario selection, no randomness, no clock dependency (AC-0.4/AC-0.5).
 * An exact narrative match (what every test in this repo uses, since tests pass one of the
 * committed fixture narratives verbatim) always wins; a keyword heuristic is a best-effort
 * fallback so the fixture provider still returns *something* sensible for arbitrary UI input
 * that doesn't exactly match a committed fixture.
 */
function selectStarsFixture(narrative: string, fixtures: StarsFixtureFile[]): StarsFixtureFile {
  const exact = fixtures.find((f) => f.narrative === narrative);
  if (exact) return exact;

  const lower = narrative.toLowerCase();
  const has = (kw: string) => lower.includes(kw);
  const turnaroundSignal = has("turnaround") || has("declin") || has("missed") || has("backlog");
  const realignmentSignal =
    has("realign") || has("restructur") || has("merger") || has("reporting structure");
  const startupSignal =
    has("startup") || has("from scratch") || has("greenfield") || has("no existing");

  let scenarioId = "thin-ambiguous";
  if (turnaroundSignal && realignmentSignal) scenarioId = "blended-turnaround-realignment";
  else if (turnaroundSignal) scenarioId = "turnaround";
  else if (startupSignal) scenarioId = "startup";

  return fixtures.find((f) => f.scenarioId === scenarioId) ?? fixtures[0];
}

export class FixtureProvider implements InferenceProvider {
  async diagnoseStars(intake: unknown): Promise<StarsDiagnosis> {
    const narrative = (intake as { narrative?: string })?.narrative ?? "";
    const fixtures = loadStarsFixtures();
    const chosen = selectStarsFixture(narrative, fixtures);
    return validateAgainstSchema(starsDiagnosisSchema, chosen.diagnosis);
  }

  async generatePlan(diagnosis: unknown): Promise<Milestone[]> {
    const dominantType = (diagnosis as { dominantType?: string })?.dominantType ?? "";
    const plans = loadPlanFixtures();
    const chosen = plans[dominantType] ?? plans["startup"];
    return chosen.milestones.map((m) => validateAgainstSchema(milestoneSchema, m));
  }
}
