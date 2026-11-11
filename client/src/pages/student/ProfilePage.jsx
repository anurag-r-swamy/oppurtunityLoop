import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ACADEMIC_DISCIPLINES,
  DEGREE_LEVELS,
  EVENT_MODES,
  EXPERIENCE_LEVELS,
  INDIAN_STATES,
  OPPORTUNITY_CATEGORIES
} from '../../lib/constants';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    collegeName: '',
    course: '',
    discipline: '',
    degreeLevel: '',
    currentYear: '',
    age: '',
    state: '',
    city: '',
    skillsText: '',
    interestsText: '',
    experienceLevel: 'beginner',
    preferredEventModes: [],
    preferredCategories: [],
    availabilityPreferences: 'flexible',
    inAppReminders: true,
    emailReminders: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const sp = user.studentProfile || {};
    const np = user.notificationPreferences || {};
    setForm({
      name: user.name || '',
      collegeName: sp.collegeName || '',
      course: sp.course || '',
      discipline: sp.discipline || '',
      degreeLevel: sp.degreeLevel || '',
      currentYear: sp.currentYear ?? '',
      age: sp.age ?? '',
      state: sp.state || '',
      city: sp.city || '',
      skillsText: (sp.skills || []).join(', '),
      interestsText: (sp.interests || []).join(', '),
      experienceLevel: sp.experienceLevel || 'beginner',
      preferredEventModes: sp.preferredEventModes || [],
      preferredCategories: sp.preferredCategories || [],
      availabilityPreferences: sp.availabilityPreferences || 'flexible',
      inAppReminders: np.inAppReminders ?? true,
      emailReminders: np.emailReminders ?? false
    });
  }, [user]);

  const toggleArrayField = (field, value) => {
    setForm((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const splitComma = (str) =>
        str
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

      const payload = {
        name: form.name,
        studentProfile: {
          collegeName: form.collegeName,
          course: form.course,
          discipline: form.discipline,
          degreeLevel: form.degreeLevel,
          currentYear: form.currentYear ? Number(form.currentYear) : null,
          age: form.age ? Number(form.age) : null,
          state: form.state,
          city: form.city,
          skills: splitComma(form.skillsText),
          interests: splitComma(form.interestsText),
          experienceLevel: form.experienceLevel,
          preferredEventModes: form.preferredEventModes,
          preferredCategories: form.preferredCategories,
          availabilityPreferences: form.availabilityPreferences
        },
        notificationPreferences: {
          inAppReminders: form.inAppReminders,
          emailReminders: form.emailReminders
        }
      };

      const res = await api.patch('/users/me', payload);
      setUser(res.data?.data?.user);
      showToast('Profile saved and recommendation engine updated!', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Student Profile & Preferences"
      subtitle={`Profile completion: ${user?.studentProfile?.profileCompletionStatus ?? 0}% — used by the Explainable Participation Engine.`}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prof-name" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-college" className="block text-sm font-medium text-slate-700">
              College / University Name
            </label>
            <input
              id="prof-college"
              type="text"
              value={form.collegeName}
              onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-discipline" className="block text-sm font-medium text-slate-700">
              Academic Discipline
            </label>
            <select
              id="prof-discipline"
              value={form.discipline}
              onChange={(e) => setForm({ ...form, discipline: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select discipline</option>
              {ACADEMIC_DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prof-degree" className="block text-sm font-medium text-slate-700">
              Degree Level
            </label>
            <select
              id="prof-degree"
              value={form.degreeLevel}
              onChange={(e) => setForm({ ...form, degreeLevel: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select degree level</option>
              {DEGREE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prof-course" className="block text-sm font-medium text-slate-700">
              Course / Program (e.g., MCA, B.Tech, BA LLB, B.Com)
            </label>
            <input
              id="prof-course"
              type="text"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prof-year" className="block text-sm font-medium text-slate-700">
                Year of Study
              </label>
              <input
                id="prof-year"
                type="number"
                min={1}
                max={7}
                value={form.currentYear}
                onChange={(e) => setForm({ ...form, currentYear: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prof-age" className="block text-sm font-medium text-slate-700">
                Age (optional)
              </label>
              <input
                id="prof-age"
                type="number"
                min={15}
                max={60}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prof-state" className="block text-sm font-medium text-slate-700">
              State
            </label>
            <select
              id="prof-state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select state</option>
              {INDIAN_STATES.filter((s) => s !== 'All India').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prof-city" className="block text-sm font-medium text-slate-700">
              City
            </label>
            <input
              id="prof-city"
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prof-skills" className="block text-sm font-medium text-slate-700">
              Skills (comma-separated)
            </label>
            <input
              id="prof-skills"
              type="text"
              value={form.skillsText}
              onChange={(e) => setForm({ ...form, skillsText: e.target.value })}
              placeholder="React, Financial Modeling, Public Speaking, Research..."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-interests" className="block text-sm font-medium text-slate-700">
              Interests (comma-separated)
            </label>
            <input
              id="prof-interests"
              type="text"
              value={form.interestsText}
              onChange={(e) => setForm({ ...form, interestsText: e.target.value })}
              placeholder="Civic Tech, Constitutional Law, UI/UX, Biostatistics..."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prof-exp" className="block text-sm font-medium text-slate-700">
              Experience Level
            </label>
            <select
              id="prof-exp"
              value={form.experienceLevel}
              onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prof-avail" className="block text-sm font-medium text-slate-700">
              Availability Preference
            </label>
            <select
              id="prof-avail"
              value={form.availabilityPreferences}
              onChange={(e) => setForm({ ...form, availabilityPreferences: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="flexible">Flexible</option>
              <option value="weekends">Weekends</option>
              <option value="weekdays">Weekdays</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Preferred Event Modes</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {EVENT_MODES.map((m) => (
              <label key={m.value} className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.preferredEventModes.includes(m.value)}
                  onChange={() => toggleArrayField('preferredEventModes', m.value)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Preferred Opportunity Categories</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {OPPORTUNITY_CATEGORIES.map((c) => (
              <label key={c.value} className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.preferredCategories.includes(c.value)}
                  onChange={() => toggleArrayField('preferredCategories', c.value)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700">Notification Preferences</p>
          <div className="mt-2 flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.inAppReminders}
                onChange={(e) => setForm({ ...form, inAppReminders: e.target.checked })}
              />
              In-app deadline reminders
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.emailReminders}
                onChange={(e) => setForm({ ...form, emailReminders: e.target.checked })}
              />
              Email deadline reminders (requires SMTP configuration on server)
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

