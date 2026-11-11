import { Search, RotateCcw } from 'lucide-react';
import {
  ACADEMIC_DISCIPLINES,
  DEGREE_LEVELS,
  EVENT_MODES,
  INDIAN_STATES,
  OPPORTUNITY_CATEGORIES
} from '../../lib/constants';

export function OpportunityFilters({ filters, onChange, onReset }) {
  const update = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <section
      aria-label="Filter opportunities"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5"
    >
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label htmlFor="filter-q" className="block text-xs font-medium text-slate-600">
            Keyword Search
          </label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="filter-q"
              type="text"
              value={filters.q || ''}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Search title, skill, tag, or organizer..."
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter-category" className="block text-xs font-medium text-slate-600">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category || ''}
            onChange={(e) => update('category', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {OPPORTUNITY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-mode" className="block text-xs font-medium text-slate-600">
            Event Mode
          </label>
          <select
            id="filter-mode"
            value={filters.mode || ''}
            onChange={(e) => update('mode', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Modes</option>
            {EVENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        <div>
          <label htmlFor="filter-fee" className="block text-xs font-medium text-slate-600">
            Fee
          </label>
          <select
            id="filter-fee"
            value={filters.feeType || ''}
            onChange={(e) => update('feeType', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Free & Paid</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-discipline" className="block text-xs font-medium text-slate-600">
            Academic Discipline
          </label>
          <select
            id="filter-discipline"
            value={filters.discipline || ''}
            onChange={(e) => update('discipline', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Any Discipline</option>
            {ACADEMIC_DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-degree" className="block text-xs font-medium text-slate-600">
            Degree Level
          </label>
          <select
            id="filter-degree"
            value={filters.degreeLevel || ''}
            onChange={(e) => update('degreeLevel', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Any Degree</option>
            {DEGREE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-state" className="block text-xs font-medium text-slate-600">
            Location / State
          </label>
          <select
            id="filter-state"
            value={filters.state || ''}
            onChange={(e) => update('state', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All India</option>
            {INDIAN_STATES.filter((s) => s !== 'All India').map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-sort" className="block text-xs font-medium text-slate-600">
            Sort By
          </label>
          <select
            id="filter-sort"
            value={filters.sort || 'deadline'}
            onChange={(e) => update('sort', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="deadline">Earliest Deadline</option>
            <option value="newest">Recently Published</option>
            <option value="relevance">Relevance / Match</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={filters.beginnerFriendly === 'true'}
              onChange={(e) => update('beginnerFriendly', e.target.checked ? 'true' : '')}
              className="rounded border-slate-300 text-indigo-600"
            />
            Beginner-friendly only
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={filters.includeExpired === 'true'}
              onChange={(e) => update('includeExpired', e.target.checked ? 'true' : '')}
              className="rounded border-slate-300 text-indigo-600"
            />
            Include historical expired listings
          </label>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      </div>
    </section>
  );
}

