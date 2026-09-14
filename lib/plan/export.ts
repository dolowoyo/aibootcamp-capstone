import { PHASES, type Plan } from "../inference/schemas/plan";

const PHASE_LABELS: Record<(typeof PHASES)[number], string> = {
  "1-30": "Days 1-30",
  "31-60": "Days 31-60",
  "61-90": "Days 61-90",
};

/**
 * Renders the current `Plan` (post-edits) to a fixed Markdown representation, grouped by
 * phase in milestone order (SPEC-002 AC-2.7). Chosen over a binary format (PDF) per PLAN-002
 * — still usable via copy or browser print-to-PDF.
 */
export function exportPlan(plan: Plan): string {
  const lines: string[] = [`# 30/60/90 Plan — ${plan.diagnosisId}`, ""];

  for (const phase of PHASES) {
    lines.push(`## ${PHASE_LABELS[phase]}`, "");
    const milestones = plan.milestones
      .filter((m) => m.phase === phase)
      .sort((a, b) => a.order - b.order);

    if (milestones.length === 0) {
      lines.push("_No milestones in this phase._", "");
      continue;
    }

    for (const m of milestones) {
      lines.push(`- **${m.text}**`);
      lines.push(`  - Rationale: ${m.rationale}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
