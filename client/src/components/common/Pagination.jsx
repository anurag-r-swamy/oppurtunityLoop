import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-3"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>
      <span className="text-sm text-slate-600">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

