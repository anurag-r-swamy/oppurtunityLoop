import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export function AdminReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data?.data?.reports || []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (id, status) => {
    try {
      await api.patch(`/admin/reports/${id}`, {
        status,
        resolutionNote: `Marked as ${status} by administrator.`
      });
      showToast(`Report updated to ${status}.`, 'success');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Reported Listings"
      subtitle="Review student reports about broken links, wrong deadlines, or suspicious listings."
    >
      {loading ? (
        <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
      ) : reports.length === 0 ? (
        <EmptyState title="No reports submitted" />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {r.reason.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
              </div>

              <h2 className="mt-2 text-base font-semibold text-slate-900">
                {r.opportunityId?.title || 'Opportunity'}
              </h2>
              <p className="mt-1 text-sm text-slate-700">{r.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                Reported by: {r.submittedBy?.name} ({r.submittedBy?.email})
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdate(r._id, 'resolved')}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Mark Resolved
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate(r._id, 'dismissed')}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

