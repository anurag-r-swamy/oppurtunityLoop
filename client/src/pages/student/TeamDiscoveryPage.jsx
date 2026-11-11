import { useCallback, useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export function TeamDiscoveryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [teams, setTeams] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    opportunityId: '',
    title: '',
    description: '',
    requiredSkillsText: '',
    desiredExperienceLevel: 'any',
    maximumMembers: 3
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, oppsRes] = await Promise.all([
        api.get('/team-requests'),
        api.get('/opportunities?limit=30')
      ]);
      setTeams(teamsRes.data?.data?.teamRequests || []);
      const teamOpps = (oppsRes.data?.data?.opportunities || []).filter(
        (o) => (o.teamSize?.max || 1) > 1
      );
      setOpportunities(teamOpps);
      if (teamOpps[0]) {
        setForm((prev) => ({
          ...prev,
          opportunityId: prev.opportunityId || teamOpps[0]._id
        }));
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const requiredSkills = form.requiredSkillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.post('/team-requests', {
        opportunityId: form.opportunityId,
        title: form.title,
        description: form.description,
        requiredSkills,
        desiredExperienceLevel: form.desiredExperienceLevel,
        maximumMembers: Number(form.maximumMembers)
      });
      showToast('Team request created!', 'success');
      setShowCreate(false);
      setForm((prev) => ({ ...prev, title: '', description: '', requiredSkillsText: '' }));
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleRequestJoin = async (teamId) => {
    try {
      await api.post(`/team-requests/${teamId}/invitations`, {
        message: 'Interested in collaborating on this opportunity.',
        skillsOffered: user?.studentProfile?.skills || []
      });
      showToast('Join request sent to the team leader!', 'success');
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleRespond = async (teamId, requestId, decision) => {
    try {
      await api.post(`/team-requests/${teamId}/respond`, { requestId, decision });
      showToast(`Request ${decision}.`, 'success');
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleCloseTeam = async (teamId) => {
    try {
      await api.patch(`/team-requests/${teamId}`, { requestStatus: 'closed' });
      showToast('Team request closed.', 'info');
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleLeave = async (teamId) => {
    try {
      await api.post(`/team-requests/${teamId}/leave`);
      showToast('You left the team.', 'info');
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Team Discovery & Requests"
      subtitle="Find teammates with complementary skills for team competitions. Private contact details stay hidden."
      actions={
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Create Team Request
        </button>
      }
    >
      {showCreate && (
        <form
          onSubmit={handleCreateTeam}
          className="mb-6 space-y-4 rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs"
        >
          <h2 className="text-base font-semibold text-slate-900">New Team Request</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="team-opp" className="block text-sm font-medium text-slate-700">
                Opportunity
              </label>
              <select
                id="team-opp"
                required
                value={form.opportunityId}
                onChange={(e) => setForm({ ...form, opportunityId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {opportunities.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.title} (Max {o.teamSize?.max})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="team-max" className="block text-sm font-medium text-slate-700">
                Team Size Limit
              </label>
              <input
                id="team-max"
                type="number"
                min={2}
                max={15}
                value={form.maximumMembers}
                onChange={(e) => setForm({ ...form, maximumMembers: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="team-title" className="block text-sm font-medium text-slate-700">
              Request Title
            </label>
            <input
              id="team-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Looking for UI/UX Designer & Backend Dev"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="team-skills" className="block text-sm font-medium text-slate-700">
              Needed Skills (comma-separated)
            </label>
            <input
              id="team-skills"
              type="text"
              value={form.requiredSkillsText}
              onChange={(e) => setForm({ ...form, requiredSkillsText: e.target.value })}
              placeholder="React, Figma, Pitching"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="team-desc" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="team-desc"
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Publish Team Request
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team requests yet"
          description="Create a team request for any multi-member competition to find collaborators."
        />
      ) : (
        <div className="space-y-4">
          {teams.map((t) => (
            <div
              key={t._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.requestStatus} />
                    <span className="text-xs font-medium text-slate-500">
                      {t.members.length}/{t.maximumMembers} members · {t.availableSlots} slot(s)
                      left
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{t.title}</h2>
                  <p className="text-xs font-medium text-indigo-600">
                    {t.opportunityId?.title}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!t.isMember && t.requestStatus === 'open' && (
                    <button
                      type="button"
                      onClick={() => handleRequestJoin(t._id)}
                      className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Request to Join
                    </button>
                  )}
                  {t.isLeader && t.requestStatus !== 'closed' && (
                    <button
                      type="button"
                      onClick={() => handleCloseTeam(t._id)}
                      className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Close Request
                    </button>
                  )}
                  {t.isMember && !t.isLeader && t.requestStatus !== 'closed' && (
                    <button
                      type="button"
                      onClick={() => handleLeave(t._id)}
                      className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Leave Team
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-700">{t.description}</p>

              {t.requiredSkills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.requiredSkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      Needs: {sk}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <strong>Members:</strong>{' '}
                {t.members
                  .map((m) => `${m.userId?.name || 'Student'} (${m.roleInTeam})`)
                  .join(', ')}
              </div>

              {t.requests?.filter((r) => r.status === 'pending').length > 0 && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">Pending Join Requests</p>
                  <div className="mt-2 space-y-2">
                    {t.requests
                      .filter((r) => r.status === 'pending')
                      .map((r) => (
                        <div
                          key={r._id}
                          className="flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <span>
                            <strong>{r.userId?.name || 'Student'}</strong> — {r.message}
                          </span>
                          {t.isLeader && (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRespond(t._id, r._id, 'accepted')}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 font-medium text-white"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespond(t._id, r._id, 'rejected')}
                                className="rounded-lg bg-rose-600 px-2.5 py-1 font-medium text-white"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

