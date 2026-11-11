import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export function OrganizerStatusPage() {
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/organizer/opportunities')
      .then((res) => setListings(res.data?.data?.opportunities || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <DashboardLayout
      title="Listing Verification Status"
      subtitle="Review administrator verification timestamps and any requested corrections."
    >
      {loading ? (
        <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
      ) : listings.length === 0 ? (
        <EmptyState title="No submitted listings" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Publication</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((o) => (
                <tr key={o._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{o.title}</p>
                    {o.rejectionReason && (
                      <p className="mt-1 text-xs text-rose-700">{o.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.verificationStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.publicationStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {o.submittedAt ? formatDate(o.submittedAt) : 'Not submitted'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {o.lastVerifiedAt ? formatDate(o.lastVerifiedAt) : '—'}
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

