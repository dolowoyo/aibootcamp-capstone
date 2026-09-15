import { PHASES } from "@lib/inference/schemas/plan";
import { exportPlan } from "@lib/plan/export";
import { getLastPlanError } from "../_lib/store";
import { diagnosisRepository, planRepository } from "../_lib/prisma-instances";
import {
  addMilestoneAction,
  editMilestoneAction,
  generatePlanAction,
  moveMilestoneAction,
} from "../_lib/actions";

const PHASE_LABELS: Record<(typeof PHASES)[number], string> = {
  "1-30": "Days 1-30",
  "31-60": "Days 31-60",
  "61-90": "Days 61-90",
};

// This page reads current DB state on every request (SPEC-004: plan state persists across
// routes/processes); it must never be statically prerendered/cached at build time or the
// deployed app would freeze on a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const diagnosisRecord = await diagnosisRepository.findLatest();
  const plan = diagnosisRecord ? await planRepository.find(diagnosisRecord.id) : null;
  const error = getLastPlanError();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">30/60/90 plan</h1>

      {!diagnosisRecord && (
        <p className="text-sm text-slate-600">
          Complete a STARS diagnosis first on the{" "}
          <a href="/diagnosis" className="text-blue-700 underline">
            Diagnosis
          </a>{" "}
          page.
        </p>
      )}

      {diagnosisRecord && !plan && (
        <form action={generatePlanAction}>
          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Generate plan for a {diagnosisRecord.effectiveType} situation
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {plan && (
        <div className="space-y-8">
          {PHASES.map((phase) => (
            <section key={phase} className="space-y-3 rounded border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">{PHASE_LABELS[phase]}</h2>
              <ul className="space-y-3">
                {plan.milestones
                  .filter((m) => m.phase === phase)
                  .sort((a, b) => a.order - b.order)
                  .map((m) => (
                    <li key={m.id} className="rounded border border-slate-100 p-3">
                      <form action={editMilestoneAction} className="space-y-1">
                        <input type="hidden" name="milestoneId" value={m.id} />
                        <textarea
                          name="text"
                          defaultValue={m.text}
                          className="w-full rounded border border-slate-300 p-2 text-sm"
                          rows={2}
                        />
                        <p className="text-xs text-slate-500">Rationale: {m.rationale}</p>
                        <button
                          type="submit"
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                        >
                          Save edit
                        </button>
                      </form>
                      <form action={moveMilestoneAction} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <input type="hidden" name="milestoneId" value={m.id} />
                        <label>
                          Move to
                          <select name="toPhase" defaultValue={m.phase} className="ml-1 rounded border p-1">
                            {PHASES.map((p) => (
                              <option key={p} value={p}>
                                {PHASE_LABELS[p]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          position
                          <input
                            type="number"
                            name="toOrder"
                            defaultValue={m.order}
                            min={0}
                            className="ml-1 w-16 rounded border p-1"
                          />
                        </label>
                        <button type="submit" className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100">
                          Move
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
              <form action={addMilestoneAction} className="flex flex-wrap items-end gap-2 text-xs">
                <input type="hidden" name="phase" value={phase} />
                <label className="flex-1">
                  New milestone
                  <input name="text" className="mt-1 w-full rounded border border-slate-300 p-2 text-sm" />
                </label>
                <label className="flex-1">
                  Rationale
                  <input name="rationale" className="mt-1 w-full rounded border border-slate-300 p-2 text-sm" />
                </label>
                <button
                  type="submit"
                  className="rounded border border-slate-300 px-3 py-2 text-xs hover:bg-slate-100"
                >
                  Add
                </button>
              </form>
            </section>
          ))}

          <section className="rounded border border-slate-200 p-4">
            <h2 className="mb-2 text-lg font-semibold">Export</h2>
            <pre className="whitespace-pre-wrap rounded bg-slate-100 p-3 text-xs">
              {exportPlan(plan)}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}
