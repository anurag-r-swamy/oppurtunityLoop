export function TermsOfUsePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Template Notice — Review Before Production Launch
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Terms of Use</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          OpportunityLoop acts as a discovery, eligibility guidance, and participation tracking
          platform. External registrations, payments, and awards occur on the official organizer
          websites linked in each listing.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-slate-900">
          Eligibility & Self-Reported Achievements
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>
            Match scores and eligibility classifications are deterministic estimates based on
            available metadata. Students should confirm final rules on the official event page.
          </li>
          <li>
            Student-recorded participation statuses and outcomes are clearly marked as
            self-reported unless explicitly confirmed by an organizer.
          </li>
          <li>
            Organizers must provide accurate official source URLs and may not submit misleading
            or fraudulent events.
          </li>
        </ul>
        <h2 className="mt-6 text-lg font-semibold text-slate-900">
          Production-Readiness Notes
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Before operating in production, add governing jurisdiction clauses, dispute resolution
          procedures, acceptable use enforcement rules, and organizer verification SLAs reviewed by
          legal counsel.
        </p>
      </div>
    </div>
  );
}

