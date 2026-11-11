import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Send, Edit } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatCategoryLabel, formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export function OrganizerOpportunitiesPage() {
  const { showToast } = useToast();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizer/opportunities');
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

  const handleSubmitForReview = async (id) => {
    try {
      await api.post(`/organizer/opportunities/${id}/submit`);
      showToast('Submitted for administrator verification!', 'success');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="My Submitted Opportunities"
      subtitle="Create, edit, and submit listings for administrator verification."
      actions={
        <Link
          to="/organizer/opportunities/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <PlusCircle className="h-4 w-4" /> New Opportunity
        </Link>
      }
    >
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No listings created yet"
          description="Create an opportunity listing with official source URLs and eligibility criteria."
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {formatCategoryLabel(o.category)}
                    </span>
                    <StatusBadge status={o.verificationStatus} />
                    <StatusBadge status={o.publicationStatus} />
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{o.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Deadline: {formatDate(o.deadline)} · Mode: {o.eventMode}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/organizer/opportunities/${o._id}/edit`}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Link>
                  {o.publicationStatus === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleSubmitForReview(o._id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      <Send className="h-3.5 w-3.5" /> Submit for Review
                    </button>
                  )}
                </div>
              </div>

              {o.rejectionReason && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800">
                  <strong>Reviewer Feedback:</strong> {o.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

