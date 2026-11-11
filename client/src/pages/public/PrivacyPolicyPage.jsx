export function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Template Notice — Review Before Production Launch
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          OpportunityLoop collects only the profile and academic attributes needed to evaluate
          opportunity eligibility, compute explainable recommendations, manage participation
          checklists, and coordinate team requests.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-slate-900">
          Data Minimization & Security Practices
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>Passwords are salted and hashed with bcrypt and never stored in plaintext.</li>
          <li>
            Authentication relies on HttpOnly session cookies rather than browser localStorage
            tokens.
          </li>
          <li>
            Private contact details are not exposed publicly in team discovery listings.
          </li>
        </ul>
        <h2 className="mt-6 text-lg font-semibold text-slate-900">
          Production-Readiness Notes
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Before deploying OpportunityLoop publicly under India&apos;s Digital Personal Data
          Protection (DPDP) Act, appoint a grievance officer, specify data retention timelines,
          add account export/deletion workflows, and have legal counsel finalize this policy.
        </p>
      </div>
    </div>
  );
}

