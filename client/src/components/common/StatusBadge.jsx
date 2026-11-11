const BADGE_STYLES = {
  eligible: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ineligible: 'bg-rose-50 text-rose-700 border-rose-200',
  unknown: 'bg-amber-50 text-amber-800 border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  needs_review: 'bg-orange-50 text-orange-800 border-orange-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  published: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  expired: 'bg-slate-200 text-slate-700 border-slate-300',
  archived: 'bg-slate-200 text-slate-600 border-slate-300',
  interested: 'bg-slate-100 text-slate-700 border-slate-200',
  registered: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  submitted: 'bg-violet-50 text-violet-700 border-violet-200',
  participated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  won: 'bg-amber-50 text-amber-800 border-amber-300',
  withdrawn: 'bg-rose-50 text-rose-700 border-rose-200',
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  full: 'bg-amber-50 text-amber-800 border-amber-200',
  closed: 'bg-slate-200 text-slate-700 border-slate-300'
};

export function StatusBadge({ status, label }) {
  const style = BADGE_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const display =
    label ||
    String(status || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {display}
    </span>
  );
}

