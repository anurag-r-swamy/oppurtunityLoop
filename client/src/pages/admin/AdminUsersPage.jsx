import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';

export function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = roleFilter ? `?role=${roleFilter}` : '';
      const res = await api.get(`/admin/users${qs}`);
      setUsers(res.data?.data?.users || []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (user) => {
    const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/admin/users/${user._id}/status`, { accountStatus: nextStatus });
      showToast(`User account ${nextStatus}.`, 'success');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Users & Organizers"
      subtitle="Manage registered students, organizers, and account statuses."
      actions={
        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="organizer">Organizers</option>
          <option value="admin">Administrators</option>
        </select>
      }
    >
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={u.accountStatus === 'active' ? 'verified' : 'rejected'}
                      label={u.accountStatus}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => toggleStatus(u)}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
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

