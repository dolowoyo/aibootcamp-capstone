"use server";

import { revalidatePath } from "next/cache";
import { diagnose } from "@lib/stars/diagnosis";
import { IntakeValidationError } from "@lib/stars/intake";
import type { StarsType } from "@lib/inference/schemas/stars-diagnosis";
import type { Phase } from "@lib/inference/schemas/plan";
import { generatePlan } from "@lib/plan/generate";
import { addMilestone, editMilestoneText, moveMilestone } from "@lib/plan/edit";
import { addStakeholder, repositionStakeholder } from "@lib/stakeholders/map";
import type { Quadrant } from "@lib/stakeholders/classify";
import {
  diagnosisRepository,
  loadStakeholderMap,
  planRepository,
  stakeholderRepository,
} from "./prisma-instances";
import { setLastIntakeError, setLastPlanError } from "./store";

export async function submitIntakeAction(formData: FormData): Promise<void> {
  const narrative = String(formData.get("narrative") ?? "");
  try {
    const diagnosis = await diagnose({ narrative });
    await diagnosisRepository.save(diagnosis, narrative);
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
  const record = await diagnosisRepository.findLatest();
  if (record) {
    await diagnosisRepository.applyOverride(record.id, correctedType);
  }
  revalidatePath("/diagnosis");
}

export async function generatePlanAction(): Promise<void> {
  const record = await diagnosisRepository.findLatest();
  if (!record) {
    setLastPlanError("A STARS diagnosis is required before a plan can be generated.");
    revalidatePath("/plan");
    return;
  }
  try {
    const newPlan = await generatePlan(record);
    const planToSave = { ...newPlan, diagnosisId: record.id };
    await planRepository.save(planToSave);
    setLastPlanError(null);
  } catch (err) {
    setLastPlanError((err as Error).message ?? "Plan generation failed.");
  }
  revalidatePath("/plan");
}

export async function editMilestoneAction(formData: FormData): Promise<void> {
  const record = await diagnosisRepository.findLatest();
  const plan = record ? await planRepository.find(record.id) : null;
  if (plan) {
    const milestoneId = String(formData.get("milestoneId"));
    const text = String(formData.get("text"));
    await planRepository.save(editMilestoneText(plan, milestoneId, text));
  }
  revalidatePath("/plan");
}

export async function addMilestoneAction(formData: FormData): Promise<void> {
  const record = await diagnosisRepository.findLatest();
  const plan = record ? await planRepository.find(record.id) : null;
  if (plan) {
    const phase = String(formData.get("phase")) as Phase;
    const text = String(formData.get("text"));
    const rationale = String(formData.get("rationale") || "Added manually.");
    await planRepository.save(addMilestone(plan, phase, text, rationale));
  }
  revalidatePath("/plan");
}

export async function moveMilestoneAction(formData: FormData): Promise<void> {
  const record = await diagnosisRepository.findLatest();
  const plan = record ? await planRepository.find(record.id) : null;
  if (plan) {
    const milestoneId = String(formData.get("milestoneId"));
    const toPhase = String(formData.get("toPhase")) as Phase;
    const toOrder = Number(formData.get("toOrder"));
    await planRepository.save(moveMilestone(plan, milestoneId, toPhase, toOrder));
  }
  revalidatePath("/plan");
}

export async function addStakeholderAction(formData: FormData): Promise<void> {
  const map = await loadStakeholderMap();
  const name = String(formData.get("name"));
  const influence = Number(formData.get("influence"));
  const support = Number(formData.get("support"));
  const updated = addStakeholder(map, { name, influence, support }, () => crypto.randomUUID());
  await stakeholderRepository.saveAll(updated.stakeholders);
  revalidatePath("/stakeholders");
}

export async function repositionStakeholderAction(formData: FormData): Promise<void> {
  const map = await loadStakeholderMap();
  const id = String(formData.get("id"));
  const quadrant = String(formData.get("quadrant")) as Quadrant;
  const updated = repositionStakeholder(map, id, quadrant);
  await stakeholderRepository.saveAll(updated.stakeholders);
  revalidatePath("/stakeholders");
}
