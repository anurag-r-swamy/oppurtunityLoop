import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCog,
  Sparkles,
  Bookmark,
  CheckSquare,
  Award,
  Bell,
  Users,
  PlusCircle,
  ListChecks,
  ShieldCheck,
  Flag,
  FolderKanban,
  FileSearch,
  BarChart3,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MENUS = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/profile', label: 'My Profile', icon: UserCog },
    { to: '/student/recommended', label: 'Recommended', icon: Sparkles },
    { to: '/student/opportunities', label: 'All Opportunities', icon: Compass },
    { to: '/student/saved', label: 'Saved', icon: Bookmark },
    { to: '/student/participations', label: 'Participation Tracker', icon: CheckSquare },
    { to: '/student/portfolio', label: 'Achievement Portfolio', icon: Award },
    { to: '/student/teams', label: 'Team Discovery', icon: Users },
    { to: '/student/notifications', label: 'Notifications', icon: Bell }
  ],
  organizer: [
    { to: '/organizer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/organizer/opportunities/new', label: 'Create Opportunity', icon: PlusCircle },
    { to: '/organizer/opportunities', label: 'My Listings', icon: ListChecks },
    { to: '/organizer/status', label: 'Verification Status', icon: ShieldCheck }
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/pending', label: 'Pending Verification', icon: ShieldCheck },
    { to: '/admin/opportunities', label: 'All Opportunities', icon: ListChecks },
    { to: '/admin/reports', label: 'Reported Listings', icon: Flag },
    { to: '/admin/users', label: 'Users & Organizers', icon: Users },
    { to: '/admin/categories', label: 'Categories & Settings', icon: FolderKanban },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileSearch }
  ]
};

export function DashboardLayout({ title, subtitle, actions, children }) {
  const { user, publicMeta } = useAuth();
  const rawItems = MENUS[user?.role] || [];
  const items = rawItems.filter(
    (item) =>
      !(
        item.to === '/student/teams' &&
        publicMeta?.settings?.teamMatchingEnabled === false
      )
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:self-start">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {user?.role} workspace
          </p>
          <nav className="flex flex-wrap gap-1 lg:flex-col" aria-label="Workspace navigation">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          {(title || actions) && (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold text-slate-900">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

