import { QUADRANT_POSTURE, type Quadrant } from "@lib/stakeholders/classify";
import { buildStakeholderMap } from "@lib/stakeholders/map";
import { stakeholderRepository } from "../_lib/prisma-instances";
import { addStakeholderAction, repositionStakeholderAction } from "../_lib/actions";

const QUADRANTS: Quadrant[] = ["ally", "opponent", "keep-informed", "monitor"];

const QUADRANT_LABELS: Record<Quadrant, string> = {
  ally: "Ally (high influence, high support)",
  opponent: "Opponent (high influence, low support)",
  "keep-informed": "Keep informed (low influence, high support)",
  monitor: "Monitor (low influence, low support)",
};

// This page reads current DB state on every request (SPEC-004: stakeholder positions
// persist across routes/processes); it must never be statically prerendered/cached at
// build time or the deployed app would freeze on a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function StakeholdersPage() {
  const stakeholders = await stakeholderRepository.findAll();
  const map = buildStakeholderMap({ status: "unavailable" }, stakeholders);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Stakeholder &amp; coalition map</h1>

      {map.dataStatus === "unavailable" && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Automatic population from your org/calendar data isn&apos;t available right now.
          Add stakeholders manually below.
        </p>
      )}
      {map.dataStatus === "partial" && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {map.skippedCount} record(s) were skipped because they were missing an influence or
          support value.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {QUADRANTS.map((quadrant) => (
          <section key={quadrant} className="rounded border border-slate-200 p-4">
            <h2 className="text-sm font-semibold">{QUADRANT_LABELS[quadrant]}</h2>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              Posture: {QUADRANT_POSTURE[quadrant]}
            </p>
            <ul className="space-y-2">
              {map.stakeholders
                .filter((s) => s.quadrant === quadrant)
                .map((s) => (
                  <li key={s.id} className="rounded border border-slate-100 p-2 text-sm">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      Influence {s.influence} / Support {s.support} ({s.source})
                    </p>
                    <form action={repositionStakeholderAction} className="mt-1 flex items-center gap-2 text-xs">
                      <input type="hidden" name="id" value={s.id} />
                      <select name="quadrant" defaultValue={s.quadrant} className="rounded border p-1">
                        {QUADRANTS.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100">
                        Reassign
                      </button>
                    </form>
                  </li>
                ))}
              {map.stakeholders.filter((s) => s.quadrant === quadrant).length === 0 && (
                <li className="text-xs text-slate-400">No stakeholders yet.</li>
              )}
            </ul>
          </section>
        ))}
      </div>

      <section className="rounded border border-slate-200 p-4">
        <h2 className="mb-2 text-lg font-semibold">Add a stakeholder manually</h2>
        <form action={addStakeholderAction} className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Name
            <input name="name" required className="mt-1 block rounded border border-slate-300 p-2" />
          </label>
          <label>
            Influence (1-10)
            <input
              name="influence"
              type="number"
              min={1}
              max={10}
              required
              className="mt-1 block w-24 rounded border border-slate-300 p-2"
            />
          </label>
          <label>
            Support (1-10)
            <input
              name="support"
              type="number"
              min={1}
              max={10}
              required
              className="mt-1 block w-24 rounded border border-slate-300 p-2"
            />
          </label>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
