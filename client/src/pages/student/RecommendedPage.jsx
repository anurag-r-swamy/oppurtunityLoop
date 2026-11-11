import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { OpportunityCard } from '../../components/opportunities/OpportunityCard';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';

export function RecommendedPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [includeIneligible, setIncludeIneligible] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(
        `/recommendations?page=${page}&limit=9&includeIneligible=${includeIneligible}`
      );
      setItems(res.data?.data?.recommendations || []);
      setPagination(res.data?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to compute recommendations.'));
    } finally {
      setLoading(false);
    }
  }, [page, includeIneligible]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleToggleBookmark = async (opp) => {
    try {
      if (opp.isBookmarked) {
        await api.delete(`/opportunities/${opp._id}/bookmark`);
      } else {
        await api.post(`/opportunities/${opp._id}/bookmark`);
      }
      setItems((prev) =>
        prev.map((row) =>
          row.opportunity._id === opp._id
            ? { ...row, opportunity: { ...row.opportunity, isBookmarked: !opp.isBookmarked } }
            : row
        )
      );
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Recommended Opportunities"
      subtitle="Ranked deterministically by eligibility certainty, match score, and upcoming deadlines."
      actions={
        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={includeIneligible}
            onChange={(e) => {
              setIncludeIneligible(e.target.checked);
              setPage(1);
            }}
          />
          Include ineligible listings (with reasons)
        </label>
      }
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="No matching recommendations found"
          description="Try updating your profile skills/interests or toggle ineligible listings to inspect eligibility rules."
          action={
            <Link
              to="/student/profile"
              className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Edit Profile
            </Link>
          }
        />
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map(({ opportunity, explanation }) => (
              <OpportunityCard
                key={opportunity._id}
                opportunity={opportunity}
                explanation={explanation}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </DashboardLayout>
  );
}

