import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../lib/api';
import {
  ACADEMIC_DISCIPLINES,
  DEGREE_LEVELS,
  EVENT_MODES,
  INDIAN_STATES,
  OPPORTUNITY_CATEGORIES
} from '../../lib/constants';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

function toInputDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export function OpportunityFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: 'hackathon',
    organizerName: '',
    officialSourceUrl: '',
    registrationUrl: '',
    eventMode: 'online',
    state: 'All India',
    city: '',
    venue: '',
    feeAmount: 0,
    deadline: '',
    eventStartDate: '',
    eventEndDate: '',
    teamMin: 1,
    teamMax: 1,
    requiredSkillsText: '',
    tagsText: '',
    checklistText: '',
    beginnerFriendly: true,
    openToAllDisciplines: true,
    allowedDisciplines: [],
    allowedDegreeLevels: ['Undergraduate', 'Postgraduate'],
    eligibilityNotes: ''
  });

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/organizer/opportunities/${id}`)
      .then((res) => {
        const o = res.data?.data?.opportunity;
        if (!o) return;
        setForm({
          title: o.title || '',
          shortDescription: o.shortDescription || '',
          fullDescription: o.fullDescription || '',
          category: o.category || 'hackathon',
          organizerName: o.organizerName || '',
          officialSourceUrl: o.officialSourceUrl || '',
          registrationUrl: o.registrationUrl || '',
          eventMode: o.eventMode || 'online',
          state: o.location?.state || 'All India',
          city: o.location?.city || '',
          venue: o.location?.venue || '',
          feeAmount: o.feeAmount ?? 0,
          deadline: toInputDate(o.deadline),
          eventStartDate: toInputDate(o.eventStartDate),
          eventEndDate: toInputDate(o.eventEndDate),
          teamMin: o.teamSize?.min ?? 1,
          teamMax: o.teamSize?.max ?? 1,
          requiredSkillsText: (o.requiredSkills || []).join(', '),
          tagsText: (o.tags || []).join(', '),
          checklistText: (o.defaultChecklist || []).join('\n'),
          beginnerFriendly: Boolean(o.beginnerFriendly),
          openToAllDisciplines: Boolean(o.eligibilityRules?.openToAllDisciplines),
          allowedDisciplines: o.eligibilityRules?.allowedDisciplines || [],
          allowedDegreeLevels: o.eligibilityRules?.allowedDegreeLevels || [],
          eligibilityNotes: o.eligibilityRules?.notes || ''
        });
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [id, isEdit, showToast]);

  const toggleItem = (field, val) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter((x) => x !== val)
        : [...prev[field], val]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const splitComma = (s) =>
        s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);

      const payload = {
        title: form.title,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        category: form.category,
        organizerName: form.organizerName || undefined,
        officialSourceUrl: form.officialSourceUrl,
        registrationUrl: form.registrationUrl,
        eventMode: form.eventMode,
        location: {
          state: form.state,
          city: form.city,
          venue: form.venue
        },
        feeAmount: Number(form.feeAmount) || 0,
        deadline: new Date(form.deadline).toISOString(),
        eventStartDate: new Date(form.eventStartDate).toISOString(),
        eventEndDate: new Date(form.eventEndDate).toISOString(),
        teamSize: {
          min: Number(form.teamMin) || 1,
          max: Number(form.teamMax) || 1
        },
        requiredSkills: splitComma(form.requiredSkillsText),
        tags: splitComma(form.tagsText),
        defaultChecklist: form.checklistText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        beginnerFriendly: form.beginnerFriendly,
        eligibilityRules: {
          openToAllDisciplines: form.openToAllDisciplines,
          allowedDisciplines: form.openToAllDisciplines ? [] : form.allowedDisciplines,
          allowedDegreeLevels: form.allowedDegreeLevels,
          notes: form.eligibilityNotes
        }
      };

      if (isEdit) {
        await api.patch(`/organizer/opportunities/${id}`, payload);
        showToast('Opportunity updated!', 'success');
      } else {
        await api.post('/organizer/opportunities', payload);
        showToast('Draft opportunity created! Submit it for review when ready.', 'success');
      }
      navigate('/organizer/opportunities');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title={isEdit ? 'Edit Opportunity' : 'Create Opportunity'}>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isEdit ? 'Edit Opportunity' : 'Create Opportunity'}
      subtitle="Provide accurate official source URLs, dates, and explicit eligibility criteria."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="opp-title" className="block text-sm font-medium text-slate-700">
              Opportunity Title
            </label>
            <input
              id="opp-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="opp-category" className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="opp-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {OPPORTUNITY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="opp-org" className="block text-sm font-medium text-slate-700">
              Organizer Display Name
            </label>
            <input
              id="opp-org"
              type="text"
              value={form.organizerName}
              onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="opp-short" className="block text-sm font-medium text-slate-700">
            Short Summary
          </label>
          <input
            id="opp-short"
            type="text"
            required
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="opp-full" className="block text-sm font-medium text-slate-700">
            Full Description
          </label>
          <textarea
            id="opp-full"
            rows={4}
            required
            value={form.fullDescription}
            onChange={(e) => setForm({ ...form, fullDescription: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="opp-source" className="block text-sm font-medium text-slate-700">
              Official Source URL (https://...)
            </label>
            <input
              id="opp-source"
              type="url"
              required
              value={form.officialSourceUrl}
              onChange={(e) => setForm({ ...form, officialSourceUrl: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="opp-regurl" className="block text-sm font-medium text-slate-700">
              Registration URL (https://...)
            </label>
            <input
              id="opp-regurl"
              type="url"
              required
              value={form.registrationUrl}
              onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="opp-mode" className="block text-sm font-medium text-slate-700">
              Event Mode
            </label>
            <select
              id="opp-mode"
              value={form.eventMode}
              onChange={(e) => setForm({ ...form, eventMode: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {EVENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="opp-state" className="block text-sm font-medium text-slate-700">
              State
            </label>
            <select
              id="opp-state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="opp-city" className="block text-sm font-medium text-slate-700">
              City
            </label>
            <input
              id="opp-city"
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="opp-fee" className="block text-sm font-medium text-slate-700">
              Fee (INR)
            </label>
            <input
              id="opp-fee"
              type="number"
              min={0}
              value={form.feeAmount}
              onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="opp-deadline" className="block text-sm font-medium text-slate-700">
              Registration Deadline
            </label>
            <input
              id="opp-deadline"
              type="date"
              required
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="opp-start" className="block text-sm font-medium text-slate-700">
              Event Start Date
            </label>
            <input
              id="opp-start"
              type="date"
              required
              value={form.eventStartDate}
              onChange={(e) => setForm({ ...form, eventStartDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="opp-end" className="block text-sm font-medium text-slate-700">
              Event End Date
            </label>
            <input
              id="opp-end"
              type="date"
              required
              value={form.eventEndDate}
              onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="opp-tmin" className="block text-sm font-medium text-slate-700">
              Min Team Size
            </label>
            <input
              id="opp-tmin"
              type="number"
              min={1}
              max={20}
              value={form.teamMin}
              onChange={(e) => setForm({ ...form, teamMin: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="opp-tmax" className="block text-sm font-medium text-slate-700">
              Max Team Size
            </label>
            <input
              id="opp-tmax"
              type="number"
              min={1}
              max={20}
              value={form.teamMax}
              onChange={(e) => setForm({ ...form, teamMax: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.beginnerFriendly}
                onChange={(e) => setForm({ ...form, beginnerFriendly: e.target.checked })}
              />
              Beginner-friendly
            </label>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.openToAllDisciplines}
              onChange={(e) => setForm({ ...form, openToAllDisciplines: e.target.checked })}
            />
            Open to all academic disciplines
          </label>

          {!form.openToAllDisciplines && (
            <div>
              <p className="text-xs font-medium text-slate-600">Allowed Academic Disciplines</p>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {ACADEMIC_DISCIPLINES.map((d) => (
                  <label key={d} className="inline-flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.allowedDisciplines.includes(d)}
                      onChange={() => toggleItem('allowedDisciplines', d)}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-600">Allowed Degree Levels</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {DEGREE_LEVELS.map((lvl) => (
                <label key={lvl} className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.allowedDegreeLevels.includes(lvl)}
                    onChange={() => toggleItem('allowedDegreeLevels', lvl)}
                  />
                  {lvl}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="opp-skills" className="block text-sm font-medium text-slate-700">
              Required Skills (comma-separated)
            </label>
            <input
              id="opp-skills"
              type="text"
              value={form.requiredSkillsText}
              onChange={(e) => setForm({ ...form, requiredSkillsText: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="opp-tags" className="block text-sm font-medium text-slate-700">
              Tags (comma-separated)
            </label>
            <input
              id="opp-tags"
              type="text"
              value={form.tagsText}
              onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="opp-checklist" className="block text-sm font-medium text-slate-700">
            Default Preparation Checklist Steps (one per line)
          </label>
          <textarea
            id="opp-checklist"
            rows={3}
            value={form.checklistText}
            onChange={(e) => setForm({ ...form, checklistText: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/organizer/opportunities')}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Listing' : 'Save Draft'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

