import type { Milestone, Phase, Plan } from "../inference/schemas/plan";

function defaultMilestoneId(): string {
  return `milestone-${Math.random().toString(36).slice(2, 10)}`;
}

/** Pure function: returns a new `Plan` with the given milestone's text replaced (AC-2.4). */
export function editMilestoneText(plan: Plan, milestoneId: string, text: string): Plan {
  return {
    ...plan,
    milestones: plan.milestones.map((m) => (m.id === milestoneId ? { ...m, text } : m)),
  };
}

/**
 * Pure function: returns a new `Plan` with a milestone appended to the given phase (AC-2.5).
 * `idFactory` is injectable so tests can supply a deterministic ID (PLAN-002's tradeoff).
 */
export function addMilestone(
  plan: Plan,
  phase: Phase,
  text: string,
  rationale: string,
  idFactory: () => string = defaultMilestoneId
): Plan {
  const phaseMilestones = plan.milestones.filter((m) => m.phase === phase);
  const order = phaseMilestones.length
    ? Math.max(...phaseMilestones.map((m) => m.order)) + 1
    : 0;
  const newMilestone: Milestone = { id: idFactory(), phase, order, text, rationale };
  return { ...plan, milestones: [...plan.milestones, newMilestone] };
}

/**
 * Pure function: returns a new `Plan` with the given milestone moved to `toPhase` at
 * `toOrder` (AC-2.6) — covers both "move to a different phase" and "reorder within a phase"
 * as one operation, per PLAN-002.
 */
export function moveMilestone(
  plan: Plan,
  milestoneId: string,
  toPhase: Phase,
  toOrder: number
): Plan {
  const target = plan.milestones.find((m) => m.id === milestoneId);
  if (!target) return plan;

  const others = plan.milestones.filter((m) => m.id !== milestoneId);
  const destinationPhaseOthers = others
    .filter((m) => m.phase === toPhase)
    .sort((a, b) => a.order - b.order);

  const insertAt = Math.max(0, Math.min(toOrder, destinationPhaseOthers.length));
  const reordered = [...destinationPhaseOthers];
  reordered.splice(insertAt, 0, { ...target, phase: toPhase, order: insertAt });
  const renumbered = reordered.map((m, idx) => ({ ...m, order: idx }));

  const untouched = others.filter((m) => m.phase !== toPhase);

  return { ...plan, milestones: [...untouched, ...renumbered] };
}
