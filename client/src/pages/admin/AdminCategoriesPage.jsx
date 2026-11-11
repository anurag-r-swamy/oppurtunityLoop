import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({
    teamMatchingEnabled: true,
    requireAdminVerification: true,
    maintenanceBanner: ''
  });
  const [newCat, setNewCat] = useState({ slug: '', name: '', description: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, setRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/settings')
      ]);
      setCategories(catRes.data?.data?.categories || []);
      if (setRes.data?.data?.settings) {
        setSettings(setRes.data.data.settings);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/categories', newCat);
      showToast('Category added!', 'success');
      setNewCat({ slug: '', name: '', description: '' });
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleToggleCategory = async (cat) => {
    try {
      await api.patch(`/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      showToast('Category updated.', 'success');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/admin/settings', {
        teamMatchingEnabled: settings.teamMatchingEnabled,
        requireAdminVerification: settings.requireAdminVerification,
        maintenanceBanner: settings.maintenanceBanner
      });
      showToast('Platform settings saved!', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout
      title="Categories & Platform Settings"
      subtitle="Configure available categories, team matching availability, and platform banners."
    >
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Platform Settings</h2>
            <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.teamMatchingEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, teamMatchingEnabled: e.target.checked })
                  }
                />
                Enable Team Discovery & Requests module
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.requireAdminVerification}
                  onChange={(e) =>
                    setSettings({ ...settings, requireAdminVerification: e.target.checked })
                  }
                />
                Require administrator verification before publishing listings
              </label>

              <div>
                <label htmlFor="maint-banner" className="block text-sm font-medium text-slate-700">
                  Maintenance / Notice Banner (optional)
                </label>
                <input
                  id="maint-banner"
                  type="text"
                  value={settings.maintenanceBanner || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceBanner: e.target.value })
                  }
                  placeholder="Leave empty when no banner is needed"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save Settings
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Categories</h2>
            <form onSubmit={handleAddCategory} className="mt-4 grid gap-2 sm:grid-cols-3">
              <input
                type="text"
                placeholder="slug (e.g. moot-court)"
                required
                value={newCat.slug}
                onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Display Name"
                required
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Add Category
              </button>
            </form>

            <ul className="mt-4 divide-y divide-slate-100">
              {categories.map((cat) => (
                <li
                  key={cat._id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{cat.name}</p>
                    <p className="text-xs text-slate-500">{cat.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      cat.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Disabled'}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

