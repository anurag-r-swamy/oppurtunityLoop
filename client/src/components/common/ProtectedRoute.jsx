import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8">
          <h1 className="text-xl font-semibold text-rose-900">Access Restricted</h1>
          <p className="mt-2 text-sm text-rose-700">
            Your account role (<strong>{user.role}</strong>) does not have permission to access
            this section.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

