import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, ShieldAlert, Clock, Flag, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, getApiErrorMessage } from '../../lib/api';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { EmptyState } from '../../components/common/EmptyState';

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data?.data || null))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error || 'Failed to load admin dashboard.'}
        </div>
      </DashboardLayout>
    );
  }

  const { stats, participationByCategory } = data;
  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, to: '/admin/users' },
    {
      label: 'Published Opportunities',
      value: stats.publishedOpportunities,
      icon: CheckCircle2,
      to: '/admin/opportunities'
    },
    {
      label: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: Clock,
      to: '/admin/pending'
    },
    {
      label: 'Expired Listings',
      value: stats.expiredListings,
      icon: ShieldAlert,
      to: '/admin/opportunities'
    },
    {
      label: 'Total Participations',
      value: stats.totalParticipations,
      icon: Award,
      to: '/admin/analytics'
    },
    { label: 'Open Reports', value: stats.openReports, icon: Flag, to: '/admin/reports' }
  ];

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Platform-wide database metrics, verification queues, and moderation overview."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.to}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{c.label}</span>
                <Icon className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{c.value}</p>
            </Link>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Participation by Category</h2>
        {participationByCategory.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No participation data recorded yet"
              description="Metrics will appear here once students track opportunities."
            />
          </div>
        ) : (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={participationByCategory}>
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

