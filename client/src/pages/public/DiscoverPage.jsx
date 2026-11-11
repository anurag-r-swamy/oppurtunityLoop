import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { OpportunityFilters } from '../../components/opportunities/OpportunityFilters';
import { OpportunityCard } from '../../components/opportunities/OpportunityCard';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';

const INITIAL_FILTERS = {
  q: '',
  category: '',
  mode: '',
  feeType: '',
  discipline: '',
  degreeLevel: '',
  state: '',
  beginnerFriendly: '',
  includeExpired: '',
  sort: 'deadline',
  page: 1,
  limit: 9
};

export function DiscoverPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    ...INITIAL_FILTERS,
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    mode: searchParams.get('mode') || '',
    sort: searchParams.get('sort') || 'deadline',
    page: Number(searchParams.get('page')) || 1
  }));

  const [opportunities, setOpportunities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      for (const [key, val] of Object.entries(filters)) {
        if (val !== '' && val !== null && val !== undefined) {
          params.set(key, String(val));
        }
      }
      const res = await api.get(`/opportunities?${params.toString()}`);
      setOpportunities(res.data?.data?.opportunities || []);
      setPagination(res.data?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load opportunities.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOpportunities();
    const nextParams = new URLSearchParams();
    if (filters.q) nextParams.set('q', filters.q);
    if (filters.category) nextParams.set('category', filters.category);
    if (filters.mode) nextParams.set('mode', filters.mode);
    if (filters.page > 1) nextParams.set('page', String(filters.page));
    setSearchParams(nextParams, { replace: true });
  }, [fetchOpportunities, filters.q, filters.category, filters.mode, filters.page, setSearchParams]);

  const handleToggleBookmark = async (opp) => {
    if (!user) {
      showToast('Please log in to bookmark opportunities.', 'info');
      return;
    }
    try {
      if (opp.isBookmarked) {
        await api.delete(`/opportunities/${opp._id}/bookmark`);
        showToast('Removed from saved opportunities.', 'info');
      } else {
        await api.post(`/opportunities/${opp._id}/bookmark`);
        showToast('Opportunity saved!', 'success');
      }
      setOpportunities((prev) =>
        prev.map((item) =>
          item._id === opp._id ? { ...item, isBookmarked: !opp.isBookmarked } : item
        )
      );
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Discover Opportunities
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Search verified competitions, symposia, quizzes, workshops, and fellowships across India.
        </p>
      </div>

      <OpportunityFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
        <span>
          Showing <strong>{opportunities.length}</strong> of <strong>{pagination.total}</strong>{' '}
          listings
        </span>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-medium text-rose-800">{error}</p>
          <button
            type="button"
            onClick={fetchOpportunities}
            className="mt-3 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {!error && loading && (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      )}

      {!error && !loading && opportunities.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Compass}
            title="No opportunities match your filters"
            description="Try clearing some filters or switching your search keywords."
            action={
              <button
                type="button"
                onClick={() => setFilters(INITIAL_FILTERS)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
              >
                Reset All Filters
              </button>
            }
          />
        </div>
      )}

      {!error && !loading && opportunities.length > 0 && (
        <>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp._id}
                opportunity={opp}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(nextPage) => setFilters((prev) => ({ ...prev, page: nextPage }))}
          />
        </>
      )}
    </div>
  );
}

