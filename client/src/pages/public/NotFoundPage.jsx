import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Compass className="mx-auto h-12 w-12 text-indigo-500" />
      <h1 className="mt-4 text-4xl font-extrabold text-slate-900">404</h1>
      <p className="mt-2 text-base font-medium text-slate-700">Page not found</p>
      <p className="mt-1 text-sm text-slate-500">
        The route you requested does not exist or may have moved.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go Home
        </Link>
        <Link
          to="/opportunities"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Discover Opportunities
        </Link>
      </div>
    </div>
  );
}

