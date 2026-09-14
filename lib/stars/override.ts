import type { StarsDiagnosis, StarsType } from "../inference/schemas/stars-diagnosis";

/**
 * Wraps a `StarsDiagnosis` so a user correction never destructively replaces the original
 * system classification (SPEC-001 AC-1.7, PLAN-001). `effectiveType` is what downstream plan
 * generation (SPEC-002) actually consumes.
 */
export interface DiagnosisRecord {
  original: StarsDiagnosis;
  override?: StarsType;
  effectiveType: StarsType;
}

export function createDiagnosisRecord(original: StarsDiagnosis): DiagnosisRecord {
  return { original, effectiveType: original.dominantType };
}

export function applyOverride(record: DiagnosisRecord, correctedType: StarsType): DiagnosisRecord {
  return {
    original: record.original,
    override: correctedType,
    effectiveType: correctedType,
  };
}
