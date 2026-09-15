import type { StarsDiagnosis, StarsType } from "../inference/schemas/stars-diagnosis";
import type { DiagnosisRecord } from "./override";

/**
 * `id` is a persistence-layer-only extension of DiagnosisRecord -- needed because
 * Plan.diagnosisId (prisma/schema.prisma) is a real foreign key, and this repository's
 * callers (a later task) need a real id to reference. lib/stars/override.ts's own
 * DiagnosisRecord type is NOT changed -- this type only lives here.
 */
export type PersistedDiagnosisRecord = DiagnosisRecord & { id: string };

/**
 * Persistence seam for a `DiagnosisRecord` (SPEC-004: diagnosis state must survive across
 * routes/processes). Kept as a swappable interface -- same reasoning as
 * `lib/plan/repository.ts`'s `PlanRepository` -- so callers can be proven to "persist on
 * subsequent retrieval" (AC-4.1/AC-4.2/AC-4.3/AC-4.4) deterministically in tests, without
 * every test run requiring a live Postgres connection. The app's API routes use
 * `createPrismaDiagnosisRepository()` against the real database; tests use
 * `createInMemoryDiagnosisRepository()`.
 */
export interface DiagnosisRepository {
  /** Creates a new record. `narrative` is stored alongside the diagnosis for the DB row. */
  save(diagnosis: StarsDiagnosis, narrative: string): Promise<PersistedDiagnosisRecord>;
  /** Updates an existing record's override, by id. Throws if no record with that id exists. */
  applyOverride(id: string, correctedType: StarsType): Promise<PersistedDiagnosisRecord>;
  /** Most recently saved record, or null if none has ever been saved. */
  findLatest(): Promise<PersistedDiagnosisRecord | null>;
}

export function createInMemoryDiagnosisRepository(): DiagnosisRepository {
  const store: PersistedDiagnosisRecord[] = [];
  let nextId = 1;

  return {
    async save(diagnosis: StarsDiagnosis) {
      const record: PersistedDiagnosisRecord = {
        id: `diagnosis-${nextId++}`,
        original: diagnosis,
        effectiveType: diagnosis.dominantType,
      };
      store.push(record);
      return JSON.parse(JSON.stringify(record)) as PersistedDiagnosisRecord;
    },
    async applyOverride(id: string, correctedType: StarsType) {
      const record = store.find((r) => r.id === id);
      if (!record) {
        throw new Error(`No diagnosis record found with id "${id}"`);
      }
      record.override = correctedType;
      record.effectiveType = correctedType;
      return JSON.parse(JSON.stringify(record)) as PersistedDiagnosisRecord;
    },
    async findLatest() {
      const latest = store[store.length - 1];
      return latest ? (JSON.parse(JSON.stringify(latest)) as PersistedDiagnosisRecord) : null;
    },
  };
}

/**
 * The minimal shape this repository needs from a generated Prisma client, so this module
 * never requires `@prisma/client` to actually be generated just to be imported (same
 * reasoning as `lib/plan/repository.ts`'s `PrismaPlanClient`).
 */
export interface PrismaDiagnosisClient {
  diagnosisRecord: {
    create(args: unknown): Promise<PrismaDiagnosisRow>;
    update(args: unknown): Promise<PrismaDiagnosisRow>;
    findFirst(args: unknown): Promise<PrismaDiagnosisRow | null>;
  };
}

interface PrismaDiagnosisRow {
  id: string;
  narrative: string;
  dominantType: string;
  secondaryType: string | null;
  confidence: string;
  rationale: string;
  evidence: unknown; // Json column -- cast to string[] when mapping
  override: string | null;
}

function toPersistedDiagnosisRecord(row: PrismaDiagnosisRow): PersistedDiagnosisRecord {
  return {
    id: row.id,
    original: {
      dominantType: row.dominantType as StarsType,
      secondaryType: row.secondaryType ? (row.secondaryType as StarsType) : undefined,
      confidence: row.confidence as StarsDiagnosis["confidence"],
      rationale: row.rationale,
      evidence: row.evidence as string[],
    },
    override: row.override ? (row.override as StarsType) : undefined,
    effectiveType: (row.override ?? row.dominantType) as StarsType,
  };
}

export function createPrismaDiagnosisRepository(
  client: PrismaDiagnosisClient,
): DiagnosisRepository {
  return {
    async save(diagnosis: StarsDiagnosis, narrative: string) {
      const row = await client.diagnosisRecord.create({
        data: {
          narrative,
          dominantType: diagnosis.dominantType,
          secondaryType: diagnosis.secondaryType ?? null,
          confidence: diagnosis.confidence,
          rationale: diagnosis.rationale,
          evidence: diagnosis.evidence,
        },
      });
      return toPersistedDiagnosisRecord(row);
    },
    async applyOverride(id: string, correctedType: StarsType) {
      const row = await client.diagnosisRecord.update({
        where: { id },
        data: { override: correctedType },
      });
      return toPersistedDiagnosisRecord(row);
    },
    async findLatest() {
      const row = await client.diagnosisRecord.findFirst({
        orderBy: { createdAt: "desc" },
      });
      return row ? toPersistedDiagnosisRecord(row) : null;
    },
  };
}
