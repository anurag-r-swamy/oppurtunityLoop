import { useCallback, useEffect, useState } from 'react';
import { Archive, RefreshCw } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';

export function AdminOpportunitiesPage() {
  const { showToast } = useToast();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/opportunities');
      setOpportunities(res.data?.data?.opportunities || []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleArchive = async (id) => {
    try {
      await api.patch(`/admin/opportunities/${id}/archive`);
      showToast('Opportunity archived.', 'info');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleMarkExpired = async () => {
    try {
      const res = await api.post('/admin/opportunities/mark-expired');
      showToast(`Marked ${res.data?.data?.modifiedCount || 0} expired listing(s).`, 'success');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Opportunity Management"
      subtitle="Inspect all listings, detect expired deadlines, and archive inappropriate items."
      actions={
        <button
          type="button"
          onClick={handleMarkExpired}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Detect & Mark Expired
        </button>
      }
    >
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Publication</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((o) => (
                <tr key={o._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{o.title}</p>
                    <p className="text-xs text-slate-500">{o.organizerName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.verificationStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.publicationStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDate(o.deadline)}</td>
                  <td className="px-4 py-3 text-right">
                    {o.publicationStatus !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => handleArchive(o._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Archive className="h-3.5 w-3.5" /> Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

