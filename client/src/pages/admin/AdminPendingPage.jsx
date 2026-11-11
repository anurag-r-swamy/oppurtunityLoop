import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export function AdminPendingPage() {
  const { showToast } = useToast();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/opportunities/pending');
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

  const handleVerify = async (id) => {
    try {
      await api.patch(`/admin/opportunities/${id}/verify`);
      showToast('Opportunity verified and published!', 'success');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleReject = async (id) => {
    const reason = (reasons[id] || '').trim();
    if (reason.length < 5) {
      showToast('Please enter a rejection/revision reason (min 5 characters).', 'error');
      return;
    }
    try {
      await api.patch(`/admin/opportunities/${id}/reject`, {
        reason,
        verificationStatus: 'rejected'
      });
      showToast('Listing rejected with feedback.', 'info');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Pending Opportunity Verification"
      subtitle="Verify official source URLs, eligibility metadata, and deadlines before publishing."
    >
      {loading ? (
        <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="Verification queue is empty"
          description="All submitted opportunities have been reviewed."
        />
      ) : (
        <div className="space-y-4">
          {opportunities.map((o) => (
            <div
              key={o._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.verificationStatus} />
                    <span className="text-xs text-slate-500">
                      Submitted by {o.submittedBy?.name || o.organizerName}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{o.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{o.shortDescription}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Deadline: {formatDate(o.deadline)}</span>
                    <a
                      href={o.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                    >
                      Check Official Source <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerify(o._id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" /> Verify & Publish
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Reason if rejecting or requesting corrections..."
                  value={reasons[o._id] || ''}
                  onChange={(e) => setReasons({ ...reasons, [o._id]: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleReject(o._id)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

