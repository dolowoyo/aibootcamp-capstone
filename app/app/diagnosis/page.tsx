import { STARS_TYPES } from "@lib/inference/schemas/stars-diagnosis";
import { getDiagnosisRecord, getLastIntakeError } from "../_lib/store";
import { correctDiagnosisAction, submitIntakeAction } from "../_lib/actions";

export default function DiagnosisPage() {
  const record = getDiagnosisRecord();
  const error = getLastIntakeError();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">STARS situation diagnosis</h1>

      <form action={submitIntakeAction} className="space-y-3">
        <label htmlFor="narrative" className="block text-sm font-medium text-slate-700">
          Describe the role you just started (at least 50 characters).
        </label>
        <textarea
          id="narrative"
          name="narrative"
          rows={6}
          className="w-full rounded border border-slate-300 p-3 text-sm"
          placeholder="I'm stepping into a newly created VP of..."
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Diagnose
        </button>
      </form>

      {record && (
        <section className="space-y-4 rounded border border-slate-200 p-4">
          <h2 className="text-lg font-semibold">Result</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="font-medium text-slate-600">Dominant type</dt>
            <dd>{record.effectiveType}</dd>
            {record.original.secondaryType && (
              <>
                <dt className="font-medium text-slate-600">Secondary type</dt>
                <dd>{record.original.secondaryType}</dd>
              </>
            )}
            <dt className="font-medium text-slate-600">Confidence</dt>
            <dd className="capitalize">{record.original.confidence}</dd>
            <dt className="font-medium text-slate-600">Rationale</dt>
            <dd>{record.original.rationale}</dd>
            <dt className="font-medium text-slate-600">Evidence</dt>
            <dd>
              <ul className="list-disc pl-5">
                {record.original.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </dd>
            {record.override && (
              <>
                <dt className="font-medium text-slate-600">Corrected to</dt>
                <dd>{record.override}</dd>
              </>
            )}
          </dl>

          <form action={correctDiagnosisAction} className="flex items-center gap-2">
            <label htmlFor="correctedType" className="text-sm font-medium text-slate-700">
              Disagree? Correct the type:
            </label>
            <select
              id="correctedType"
              name="correctedType"
              defaultValue={record.effectiveType}
              className="rounded border border-slate-300 p-1 text-sm"
            >
              {STARS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
            >
              Apply correction
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
