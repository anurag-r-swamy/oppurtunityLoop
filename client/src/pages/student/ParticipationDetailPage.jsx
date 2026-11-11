import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ExternalLink } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { PARTICIPATION_STATUSES, PARTICIPATION_TRANSITIONS } from '../../lib/constants';
import { formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';

export function ParticipationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState('');

  const [form, setForm] = useState({
    status: 'interested',
    outcome: '',
    evidenceUrl: '',
    personalNotes: '',
    checklist: []
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/participations/${id}`);
      const p = res.data?.data?.participation;
      setRecord(p);
      setForm({
        status: p.status,
        outcome: p.outcome || '',
        evidenceUrl: p.evidenceUrl || '',
        personalNotes: p.personalNotes || '',
        checklist: p.preparationChecklist || []
      });
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item, i) =>
        i === idx ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const handleAddItem = () => {
    const text = newTask.trim();
    if (!text) return;
    setForm((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { text, completed: false }]
    }));
    setNewTask('');
  };

  const handleRemoveItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        outcome: form.outcome,
        evidenceUrl: form.evidenceUrl,
        personalNotes: form.personalNotes,
        preparationChecklist: form.checklist.map((item) => ({
          ...(item._id ? { _id: item._id } : {}),
          text: item.text,
          completed: item.completed
        }))
      };
      if (form.status !== record.status) {
        payload.status = form.status;
      }

      const res = await api.patch(`/participations/${id}`, payload);
      const updated = res.data?.data?.participation;
      setRecord(updated);
      setForm((prev) => ({
        ...prev,
        status: updated.status,
        checklist: updated.preparationChecklist || []
      }));
      showToast('Participation record updated!', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/participations/${id}`);
      showToast('Participation record deleted.', 'info');
      navigate('/student/participations');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Participation Details">
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      </DashboardLayout>
    );
  }

  if (!record) {
    return (
      <DashboardLayout title="Participation Details">
        <p className="text-sm text-rose-700">Participation record not found.</p>
      </DashboardLayout>
    );
  }

  const allowedTransitions = PARTICIPATION_TRANSITIONS[record.status] || [];
  const selectableStatuses = PARTICIPATION_STATUSES.filter(
    (s) => s.value === record.status || allowedTransitions.includes(s.value)
  );

  return (
    <DashboardLayout
      title={record.opportunityId?.title || 'Participation Details'}
      subtitle="Manage preparation checklist, registration status, and outcome evidence."
      actions={
        <Link
          to="/student/participations"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Tracked
        </Link>
      }
    >
      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {record.verificationOrigin === 'organizer_confirmed'
                ? 'Organizer Confirmed'
                : 'Self-reported activity'}
            </span>
          </div>
          {record.opportunityId?.registrationUrl && (
            <a
              href={record.opportunityId.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
            >
              External Registration Link <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="part-status" className="block text-sm font-medium text-slate-700">
              Participation Status
            </label>
            <select
              id="part-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {selectableStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Valid next steps from &quot;{record.status}&quot;:{' '}
              {allowedTransitions.length ? allowedTransitions.join(', ') : 'none (final state)'}
            </p>
          </div>

          <div>
            <label htmlFor="part-outcome" className="block text-sm font-medium text-slate-700">
              Outcome / Recognition (optional)
            </label>
            <input
              id="part-outcome"
              type="text"
              value={form.outcome}
              onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              placeholder="e.g., Top 10 Finalist, Poster Presenter, Completed"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="part-evidence" className="block text-sm font-medium text-slate-700">
            Submission / Certificate / Portfolio Evidence URL (optional)
          </label>
          <input
            id="part-evidence"
            type="url"
            value={form.evidenceUrl}
            onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })}
            placeholder="https://example.org/certificate-or-repo"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Checklist */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Preparation Checklist</h2>
          <div className="mt-2 space-y-2">
            {form.checklist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2"
              >
                <label className="flex flex-1 items-center gap-2.5 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleItem(idx)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className={item.completed ? 'line-through text-slate-400' : ''}>
                    {item.text}
                  </span>
                </label>
                <button
                  type="button"
                  aria-label="Remove checklist item"
                  onClick={() => handleRemoveItem(idx)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add custom preparation task..."
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="part-notes" className="block text-sm font-medium text-slate-700">
            Personal Notes & Learnings
          </label>
          <textarea
            id="part-notes"
            rows={3}
            value={form.personalNotes}
            onChange={(e) => setForm({ ...form, personalNotes: e.target.value })}
            placeholder="Track ideas, submission deadlines, teammate notes, or reflection..."
            className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            {record.registeredAt && <span className="mr-3">Registered: {formatDate(record.registeredAt)}</span>}
            {record.submittedAt && <span className="mr-3">Submitted: {formatDate(record.submittedAt)}</span>}
            {record.participatedAt && <span>Completed: {formatDate(record.participatedAt)}</span>}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Delete Record
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}

