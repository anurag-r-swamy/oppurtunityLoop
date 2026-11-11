import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Compass className="h-5 w-5 text-indigo-600" />
            <span>OpportunityLoop</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Discover. Participate. Grow. Built for Indian students across all academic disciplines.
          </p>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-slate-600">
          <Link to="/opportunities" className="hover:text-indigo-600">
            Discover
          </Link>
          <Link to="/register" className="hover:text-indigo-600">
            For Organizers
          </Link>
          <Link to="/privacy" className="hover:text-indigo-600">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-indigo-600">
            Terms of Use
          </Link>
        </div>
      </div>
    </footer>
  );
}

