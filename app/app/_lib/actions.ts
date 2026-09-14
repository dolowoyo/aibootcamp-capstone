"use server";

import { revalidatePath } from "next/cache";
import { diagnose } from "@lib/stars/diagnosis";
import { IntakeValidationError } from "@lib/stars/intake";
import { applyOverride, createDiagnosisRecord } from "@lib/stars/override";
import type { StarsType } from "@lib/inference/schemas/stars-diagnosis";
import type { Phase } from "@lib/inference/schemas/plan";
import { generatePlan } from "@lib/plan/generate";
import { addMilestone, editMilestoneText, moveMilestone } from "@lib/plan/edit";
import { addStakeholder, repositionStakeholder } from "@lib/stakeholders/map";
import type { Quadrant } from "@lib/stakeholders/classify";
import {
  getDiagnosisRecord,
  getPlan,
  getStakeholderMap,
  setDiagnosisRecord,
  setLastIntakeError,
  setLastPlanError,
  setPlan,
  setStakeholderMap,
} from "./store";

export async function submitIntakeAction(formData: FormData): Promise<void> {
  const narrative = String(formData.get("narrative") ?? "");
  try {
    const diagnosis = await diagnose({ narrative });
    setDiagnosisRecord(createDiagnosisRecord(diagnosis));
    setPlan(null); // a fresh diagnosis invalidates any previously generated plan reference
    setLastIntakeError(null);
  } catch (err) {
    if (err instanceof IntakeValidationError) {
      setLastIntakeError(`${err.field}: ${err.message}`);
    } else {
      setLastIntakeError((err as Error).message ?? "Diagnosis failed.");
    }
  }
  revalidatePath("/diagnosis");
}

export async function correctDiagnosisAction(formData: FormData): Promise<void> {
  const correctedType = String(formData.get("correctedType") ?? "") as StarsType;
  const record = getDiagnosisRecord();
  if (record) {
    setDiagnosisRecord(applyOverride(record, correctedType));
  }
  revalidatePath("/diagnosis");
}

export async function generatePlanAction(): Promise<void> {
  const record = getDiagnosisRecord();
  try {
    const newPlan = await generatePlan(record);
    setPlan(newPlan);
    setLastPlanError(null);
  } catch (err) {
    setLastPlanError((err as Error).message ?? "Plan generation failed.");
  }
  revalidatePath("/plan");
}

export async function editMilestoneAction(formData: FormData): Promise<void> {
  const plan = getPlan();
  if (plan) {
    const milestoneId = String(formData.get("milestoneId"));
    const text = String(formData.get("text"));
    setPlan(editMilestoneText(plan, milestoneId, text));
  }
  revalidatePath("/plan");
}

export async function addMilestoneAction(formData: FormData): Promise<void> {
  const plan = getPlan();
  if (plan) {
    const phase = String(formData.get("phase")) as Phase;
    const text = String(formData.get("text"));
    const rationale = String(formData.get("rationale") || "Added manually.");
    setPlan(addMilestone(plan, phase, text, rationale));
  }
  revalidatePath("/plan");
}

export async function moveMilestoneAction(formData: FormData): Promise<void> {
  const plan = getPlan();
  if (plan) {
    const milestoneId = String(formData.get("milestoneId"));
    const toPhase = String(formData.get("toPhase")) as Phase;
    const toOrder = Number(formData.get("toOrder"));
    setPlan(moveMilestone(plan, milestoneId, toPhase, toOrder));
  }
  revalidatePath("/plan");
}

export async function addStakeholderAction(formData: FormData): Promise<void> {
  const map = getStakeholderMap();
  const name = String(formData.get("name"));
  const influence = Number(formData.get("influence"));
  const support = Number(formData.get("support"));
  setStakeholderMap(addStakeholder(map, { name, influence, support }));
  revalidatePath("/stakeholders");
}

export async function repositionStakeholderAction(formData: FormData): Promise<void> {
  const map = getStakeholderMap();
  const id = String(formData.get("id"));
  const quadrant = String(formData.get("quadrant")) as Quadrant;
  setStakeholderMap(repositionStakeholder(map, id, quadrant));
  revalidatePath("/stakeholders");
}
