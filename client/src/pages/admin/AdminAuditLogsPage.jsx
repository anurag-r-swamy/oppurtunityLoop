import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { EmptyState } from '../../components/common/EmptyState';

export function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/audit-logs')
      .then((res) => setLogs(res.data?.data?.logs || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <DashboardLayout
      title="Administrative Audit Logs"
      subtitle="Immutable trail of sensitive verification, moderation, and platform configuration actions."
    >
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs recorded yet" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {log.actorId?.name || 'Admin'}
                  </td>
                  <td className="px-4 py-3 font-mono text-indigo-700">{log.action}</td>
                  <td className="px-4 py-3">{log.entityType}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {JSON.stringify(log.metadata || {})}
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

