import { CheckCircle2, AlertCircle, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';

export function ExplanationPanel({ explanation }) {
  if (!explanation) return null;

  return (
    <section
      aria-label="Explainable Participation Engine analysis"
      className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Explainable Participation Analysis
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={explanation.eligibility} />
          <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
            Match Score: {explanation.score}/100
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        Calculated deterministically from your profile and listed event criteria (Model{' '}
        {explanation.scoreVersion}). This score reflects profile fit, not probability of winning.
      </p>

      {explanation.ineligibilityReasons?.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
            <AlertCircle className="h-4 w-4" />
            Why this listing is marked ineligible
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-rose-700">
            {explanation.ineligibilityReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {explanation.reasons?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Why it matches
          </p>
          <ul className="mt-2 space-y-1.5">
            {explanation.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {explanation.missingInformation?.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <HelpCircle className="h-4 w-4" />
            Missing information preventing full certainty
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-amber-800">
            {explanation.missingInformation.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <Link
            to="/student/profile"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline"
          >
            Update your profile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {explanation.scoreBreakdown && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Score Breakdown
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {Object.entries(explanation.scoreBreakdown).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs border border-slate-200"
              >
                <span className="capitalize text-slate-700">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="font-semibold text-slate-900">
                  {val.score} / {val.max}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {explanation.nextActions?.length > 0 && (
        <div className="mt-4 border-t border-indigo-200/70 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Suggested Next Steps
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-slate-700">
            {explanation.nextActions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

