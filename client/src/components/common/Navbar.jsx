import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Compass, Menu, X, Bell, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user, logout, publicMeta } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'organizer'
        ? '/organizer'
        : '/student';

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {publicMeta?.settings?.maintenanceBanner && (
        <div className="bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-900 border-b border-amber-200">
          {publicMeta.settings.maintenanceBanner}
        </div>
      )}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Compass className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">OpportunityLoop</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <NavLink to="/opportunities" className={navLinkClass}>
            Discover
          </NavLink>
          {user?.role === 'student' && (
            <>
              <NavLink to="/student/recommended" className={navLinkClass}>
                Recommended
              </NavLink>
              <NavLink to="/student/participations" className={navLinkClass}>
                Tracker
              </NavLink>
              {publicMeta?.settings?.teamMatchingEnabled !== false && (
                <NavLink to="/student/teams" className={navLinkClass}>
                  Teams
                </NavLink>
              )}
            </>
          )}
          {user?.role === 'organizer' && (
            <NavLink to="/organizer/opportunities" className={navLinkClass}>
              My Listings
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin/pending" className={navLinkClass}>
              Verification Queue
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.role === 'student' && (
                <Link
                  to="/student/notifications"
                  aria-label="Notifications"
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                >
                  <Bell className="h-5 w-5" />
                </Link>
              )}
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>{user.name}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink
              to="/opportunities"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass}
            >
              Discover Opportunities
            </NavLink>
            {user ? (
              <>
                <NavLink
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
                >
                  Dashboard
                </NavLink>
                {user.role === 'student' && (
                  <>
                    <NavLink
                      to="/student/recommended"
                      onClick={() => setMobileOpen(false)}
                      className={navLinkClass}
                    >
                      Recommended
                    </NavLink>
                    <NavLink
                      to="/student/participations"
                      onClick={() => setMobileOpen(false)}
                      className={navLinkClass}
                    >
                      Participation Tracker
                    </NavLink>
                    <NavLink
                      to="/student/teams"
                      onClick={() => setMobileOpen(false)}
                      className={navLinkClass}
                    >
                      Team Discovery
                    </NavLink>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-left text-sm font-medium text-rose-700"
                >
                  Logout ({user.name})
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

