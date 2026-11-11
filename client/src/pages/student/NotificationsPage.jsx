import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { EmptyState } from '../../components/common/EmptyState';

export function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.data?.notifications || []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      showToast('All notifications marked as read.', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleCheckDeadlines = async () => {
    try {
      const res = await api.post('/notifications/check-deadlines');
      const created = res.data?.data?.created || 0;
      showToast(
        created > 0 ? `Generated ${created} new deadline reminder(s).` : 'No new deadline reminders due.',
        'info'
      );
      if (created > 0) load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Notifications & Deadline Reminders"
      subtitle="In-app reminders for upcoming saved or tracked opportunity deadlines and team updates."
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCheckDeadlines}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Check Deadlines Now
          </button>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Reminders appear automatically when tracked or bookmarked deadlines approach."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${
                n.readAt
                  ? 'border-slate-200 bg-white'
                  : 'border-indigo-200 bg-indigo-50/40'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                <p className="mt-1.5 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
              </div>
              {!n.readAt && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n._id)}
                  className="shrink-0 rounded-lg border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

