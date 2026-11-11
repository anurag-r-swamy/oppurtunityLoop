import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { PARTICIPATION_STATUSES } from '../../lib/constants';
import { formatDate } from '../../lib/formatters';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export function ParticipationTrackerPage() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/participations${qs}`);
      setItems(res.data?.data?.participations || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout
      title="Participation Tracker"
      subtitle="Track your journey from discovery and checklists to registration, submission, and outcomes."
      actions={
        <select
          aria-label="Filter by participation status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {PARTICIPATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      }
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tracked participations"
          description="Open an opportunity listing and click 'Track & Checklist' to start preparing."
          action={
            <Link
              to="/opportunities"
              className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Find Opportunities
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((p) => {
            const totalTasks = p.preparationChecklist?.length || 0;
            const doneTasks = (p.preparationChecklist || []).filter((t) => t.completed).length;

            return (
              <div
                key={p._id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                      {p.verificationOrigin === 'organizer_confirmed'
                        ? 'Organizer Confirmed'
                        : 'Self-reported'}
                    </span>
                  </div>
                  <Link
                    to={`/student/participations/${p._id}`}
                    className="mt-2 block text-lg font-semibold text-slate-900 hover:text-indigo-600"
                  >
                    {p.opportunityId?.title || 'Opportunity Listing'}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    Deadline: {formatDate(p.opportunityId?.deadline)} · Checklist: {doneTasks}/
                    {totalTasks} completed
                  </p>
                </div>

                <Link
                  to={`/student/participations/${p._id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-600"
                >
                  Open Checklist <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

