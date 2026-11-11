import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ExternalLink } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatCategoryLabel, formatDate } from '../../lib/formatters';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export function PortfolioPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/participations')
      .then((res) => {
        const all = res.data?.data?.participations || [];
        setRecords(
          all.filter((p) => ['submitted', 'participated', 'won'].includes(p.status))
        );
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      title="Achievement Portfolio"
      subtitle="Chronological record of your submissions, participation milestones, and outcomes."
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : records.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No portfolio records yet"
          description="As you mark tracked opportunities as Submitted, Participated, or Won, they appear here."
          action={
            <Link
              to="/student/participations"
              className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Open Participation Tracker
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {records.map((item) => (
            <article
              key={item._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {item.verificationOrigin === 'organizer_confirmed'
                      ? 'Organizer Confirmed'
                      : 'Self-reported record'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {formatDate(item.participatedAt || item.submittedAt || item.updatedAt)}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                {item.opportunityId?.title || 'Competition'}
              </h2>
              <p className="text-xs text-slate-500">
                {formatCategoryLabel(item.opportunityId?.category)} ·{' '}
                {item.opportunityId?.organizerName}
              </p>

              {item.outcome && (
                <p className="mt-2 text-sm font-medium text-indigo-700">
                  Outcome: {item.outcome}
                </p>
              )}

              {item.personalNotes && (
                <p className="mt-2 text-sm text-slate-600">{item.personalNotes}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {item.evidenceUrl && (
                  <a
                    href={item.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                  >
                    View Evidence / Certificate <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Link
                  to={`/student/participations/${item._id}`}
                  className="font-medium text-slate-600 hover:text-indigo-600"
                >
                  Edit Entry
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

