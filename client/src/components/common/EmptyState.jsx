import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-400" />
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

