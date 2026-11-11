import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, Clock, CheckCircle2, XCircle, Archive } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export function OrganizerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/organizer/dashboard')
      .then((res) => setData(res.data?.data || null))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Organizer Dashboard">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Organizer Dashboard">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error || 'Could not load organizer dashboard.'}
        </div>
      </DashboardLayout>
    );
  }

  const { stats, recentOpportunities } = data;
  const statCards = [
    { label: 'Drafts', value: stats.drafts, icon: FileText },
    { label: 'Pending Verification', value: stats.pendingVerification, icon: Clock },
    { label: 'Published', value: stats.published, icon: CheckCircle2 },
    { label: 'Expired', value: stats.expired, icon: Archive },
    { label: 'Rejected / Revision', value: stats.rejected, icon: XCircle }
  ];

  return (
    <DashboardLayout
      title="Organizer Dashboard"
      subtitle="Manage your competition submissions and track administrator verification."
      actions={
        <Link
          to="/organizer/opportunities/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <PlusCircle className="h-4 w-4" /> Create Opportunity
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{c.label}</span>
                <Icon className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{c.value}</p>
            </div>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Submissions</h2>
          <Link to="/organizer/opportunities" className="text-xs font-medium text-indigo-600">
            Manage All
          </Link>
        </div>

        {recentOpportunities.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No opportunities submitted yet"
              description="Create your first draft listing and submit it to administrators for verification."
              action={
                <Link
                  to="/organizer/opportunities/new"
                  className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Create Listing
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {recentOpportunities.map((o) => (
              <div
                key={o._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">{o.title}</p>
                  <p className="text-xs text-slate-500">
                    Deadline: {formatDate(o.deadline)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.verificationStatus} />
                  <StatusBadge status={o.publicationStatus} />
                  <Link
                    to={`/organizer/opportunities/${o._id}/edit`}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

