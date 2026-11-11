import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { OpportunityCard } from '../../components/opportunities/OpportunityCard';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';

export function SavedOpportunitiesPage() {
  const { showToast } = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/bookmarks')
      .then((res) => setBookmarks(res.data?.data?.bookmarks || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleRemove = async (opp) => {
    try {
      await api.delete(`/opportunities/${opp._id}/bookmark`);
      setBookmarks((prev) => prev.filter((b) => b.opportunityId._id !== opp._id));
      showToast('Removed from saved opportunities.', 'info');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Saved Opportunities"
      subtitle="Bookmarked events you want to review or prepare for later."
    >
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved opportunities yet"
          description="Bookmark listings while browsing to keep track of their deadlines here."
          action={
            <Link
              to="/opportunities"
              className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Browse Opportunities
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) => (
            <OpportunityCard
              key={b._id}
              opportunity={{ ...b.opportunityId, isBookmarked: true }}
              onToggleBookmark={handleRemove}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

