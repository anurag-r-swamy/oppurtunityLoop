import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Calendar,
  CheckSquare,
  Award,
  Bell,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate, formatDeadlineCountdown } from '../../lib/formatters';

export function StudentDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/users/me/dashboard')
      .then((res) => setData(res.data?.data || null))
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load dashboard.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          {error || 'Dashboard unavailable.'}
        </div>
      </DashboardLayout>
    );
  }

  const { stats, profileCompletion, recommended, upcomingDeadlines, recentParticipations, recentNotifications } =
    data;

  const cards = [
    { label: 'Saved Opportunities', value: stats.savedCount, icon: Bookmark, to: '/student/saved' },
    {
      label: 'Active Participations',
      value: stats.activeParticipations,
      icon: CheckSquare,
      to: '/student/participations'
    },
    {
      label: 'Checklist Progress',
      value: `${stats.checklistProgress.completed}/${stats.checklistProgress.total}`,
      icon: Sparkles,
      to: '/student/participations'
    },
    {
      label: 'Achievements Recorded',
      value: stats.achievementsCount,
      icon: Award,
      to: '/student/portfolio'
    }
  ];

  return (
    <DashboardLayout
      title="Student Dashboard"
      subtitle="Real-time summary of your recommendations, deadlines, checklists, and portfolio."
      actions={
        <Link
          to="/student/profile"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Profile Completion: {profileCompletion}%
        </Link>
      }
    >
      {profileCompletion < 70 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-900">
            Your profile is <strong>{profileCompletion}%</strong> complete. Adding your
            discipline, degree, skills, and interests improves eligibility evaluation.
          </p>
          <Link
            to="/student/profile"
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Complete Profile
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.to}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{c.label}</span>
                <Icon className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{c.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Recommended */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Top Recommended for You</h2>
          <Link
            to="/student/recommended"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recommended.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No active recommendations right now"
              description="Complete your profile or explore all opportunities."
              action={
                <Link
                  to="/opportunities"
                  className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Browse Opportunities
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {recommended.map(({ opportunity, explanation }) => (
              <div
                key={opportunity._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={explanation.eligibility} />
                  <span className="text-xs font-semibold text-indigo-700">
                    Score: {explanation.score}/100
                  </span>
                </div>
                <Link
                  to={`/opportunities/${opportunity._id}`}
                  className="mt-2 block text-base font-semibold text-slate-900 hover:text-indigo-600"
                >
                  {opportunity.title}
                </Link>
                <p className="mt-1 text-xs text-slate-600">
                  {explanation.reasons[0] || 'Check eligibility details on listing page.'}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Deadline: {formatDate(opportunity.deadline)} (
                  {formatDeadlineCountdown(opportunity.deadline)})
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Deadlines & Notifications */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Upcoming Tracked Deadlines
            </h2>
            <Link to="/student/participations" className="text-xs font-medium text-indigo-600">
              Tracker
            </Link>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No saved or tracked deadlines coming up.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {upcomingDeadlines.map((item) => (
                <li key={item._id} className="flex items-center justify-between py-2.5 text-sm">
                  <Link
                    to={`/opportunities/${item._id}`}
                    className="font-medium text-slate-800 hover:text-indigo-600"
                  >
                    {item.title}
                  </Link>
                  <span className="shrink-0 text-xs font-semibold text-amber-700">
                    {formatDeadlineCountdown(item.deadline)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Bell className="h-4 w-4 text-indigo-600" />
              Recent Notifications ({stats.unreadNotifications} unread)
            </h2>
            <Link to="/student/notifications" className="text-xs font-medium text-indigo-600">
              View all
            </Link>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recentNotifications.map((n) => (
                <li key={n._id} className="py-2.5">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent Participations */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Participation Activity</h2>
          <Link to="/student/participations" className="text-xs font-medium text-indigo-600">
            Manage All
          </Link>
        </div>
        {recentParticipations.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            You haven&apos;t tracked any participation yet. Open any opportunity and click &quot;Track
            &amp; Checklist&quot;.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {recentParticipations.map((p) => (
              <div key={p._id} className="flex items-center justify-between py-2.5 text-sm">
                <Link
                  to={`/student/participations/${p._id}`}
                  className="font-medium text-slate-800 hover:text-indigo-600"
                >
                  {p.opportunityId?.title || 'Opportunity'}
                </Link>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

