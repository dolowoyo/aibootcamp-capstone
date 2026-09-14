import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">First 90 — Onboarding Accelerator</h1>
      <p className="text-slate-600">
        Based on Michael Watkins&apos; <em>The First 90 Days</em>. Describe the role you just
        started, get a STARS situation diagnosis, generate an editable 30/60/90 milestone
        plan, and see your stakeholders plotted on an influence &times; support grid.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-slate-700">
        <li>
          <Link href="/diagnosis" className="text-blue-700 underline">
            Diagnose your situation
          </Link>{" "}
          from a free-text narrative.
        </li>
        <li>
          <Link href="/plan" className="text-blue-700 underline">
            Generate your 30/60/90 plan
          </Link>{" "}
          once a diagnosis exists.
        </li>
        <li>
          <Link href="/stakeholders" className="text-blue-700 underline">
            Build your stakeholder map
          </Link>{" "}
          — auto-populated where data is available, editable by hand always.
        </li>
      </ol>
    </div>
  );
}
