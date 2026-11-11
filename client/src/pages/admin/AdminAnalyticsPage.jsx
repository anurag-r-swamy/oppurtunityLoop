import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, getApiErrorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { EmptyState } from '../../components/common/EmptyState';

export function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/analytics/participation')
      .then((res) => setAnalytics(res.data?.data || null))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <DashboardLayout
      title="Aggregate Participation Analytics"
      subtitle="Database-derived distributions by category, academic discipline, and status."
    >
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      ) : !analytics ? (
        <EmptyState title="Analytics unavailable" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Participation by Category</h2>
            {analytics.byCategory.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No participation records yet.</p>
            ) : (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byCategory}>
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">
              Participation by Academic Discipline
            </h2>
            {analytics.byDiscipline.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No participation records yet.</p>
            ) : (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byDiscipline}>
                    <XAxis dataKey="discipline" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
            <h2 className="text-base font-bold text-slate-900">Participation by Status</h2>
            {analytics.byStatus.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No participation records yet.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                {analytics.byStatus.map((s) => (
                  <div
                    key={s.status}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-xs font-medium uppercase text-slate-500">{s.status}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{s.count}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

