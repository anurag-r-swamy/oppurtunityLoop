import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Eager public entry pages
import { LandingPage } from './pages/public/LandingPage';
import { DiscoverPage } from './pages/public/DiscoverPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Lazy-loaded pages for route-level code splitting
const lazyNamed = (loader, exportName) =>
  lazy(() => loader().then((m) => ({ default: m[exportName] })));

const OpportunityDetailPage = lazyNamed(
  () => import('./pages/public/OpportunityDetailPage'),
  'OpportunityDetailPage'
);
const PrivacyPolicyPage = lazyNamed(
  () => import('./pages/public/PrivacyPolicyPage'),
  'PrivacyPolicyPage'
);
const TermsOfUsePage = lazyNamed(
  () => import('./pages/public/TermsOfUsePage'),
  'TermsOfUsePage'
);
const NotFoundPage = lazyNamed(() => import('./pages/public/NotFoundPage'), 'NotFoundPage');

const StudentDashboardPage = lazyNamed(
  () => import('./pages/student/StudentDashboardPage'),
  'StudentDashboardPage'
);
const ProfilePage = lazyNamed(() => import('./pages/student/ProfilePage'), 'ProfilePage');
const RecommendedPage = lazyNamed(
  () => import('./pages/student/RecommendedPage'),
  'RecommendedPage'
);
const SavedOpportunitiesPage = lazyNamed(
  () => import('./pages/student/SavedOpportunitiesPage'),
  'SavedOpportunitiesPage'
);
const ParticipationTrackerPage = lazyNamed(
  () => import('./pages/student/ParticipationTrackerPage'),
  'ParticipationTrackerPage'
);
const ParticipationDetailPage = lazyNamed(
  () => import('./pages/student/ParticipationDetailPage'),
  'ParticipationDetailPage'
);
const PortfolioPage = lazyNamed(() => import('./pages/student/PortfolioPage'), 'PortfolioPage');
const NotificationsPage = lazyNamed(
  () => import('./pages/student/NotificationsPage'),
  'NotificationsPage'
);
const TeamDiscoveryPage = lazyNamed(
  () => import('./pages/student/TeamDiscoveryPage'),
  'TeamDiscoveryPage'
);

const OrganizerDashboardPage = lazyNamed(
  () => import('./pages/organizer/OrganizerDashboardPage'),
  'OrganizerDashboardPage'
);
const OrganizerOpportunitiesPage = lazyNamed(
  () => import('./pages/organizer/OrganizerOpportunitiesPage'),
  'OrganizerOpportunitiesPage'
);
const OpportunityFormPage = lazyNamed(
  () => import('./pages/organizer/OpportunityFormPage'),
  'OpportunityFormPage'
);
const OrganizerStatusPage = lazyNamed(
  () => import('./pages/organizer/OrganizerStatusPage'),
  'OrganizerStatusPage'
);

const AdminDashboardPage = lazyNamed(
  () => import('./pages/admin/AdminDashboardPage'),
  'AdminDashboardPage'
);
const AdminPendingPage = lazyNamed(
  () => import('./pages/admin/AdminPendingPage'),
  'AdminPendingPage'
);
const AdminOpportunitiesPage = lazyNamed(
  () => import('./pages/admin/AdminOpportunitiesPage'),
  'AdminOpportunitiesPage'
);
const AdminReportsPage = lazyNamed(
  () => import('./pages/admin/AdminReportsPage'),
  'AdminReportsPage'
);
const AdminUsersPage = lazyNamed(() => import('./pages/admin/AdminUsersPage'), 'AdminUsersPage');
const AdminCategoriesPage = lazyNamed(
  () => import('./pages/admin/AdminCategoriesPage'),
  'AdminCategoriesPage'
);
const AdminAuditLogsPage = lazyNamed(
  () => import('./pages/admin/AdminAuditLogsPage'),
  'AdminAuditLogsPage'
);
const AdminAnalyticsPage = lazyNamed(
  () => import('./pages/admin/AdminAnalyticsPage'),
  'AdminAnalyticsPage'
);

function RouteFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/opportunities" element={<DiscoverPage />} />
          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfUsePage />} />

          {/* Student */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/recommended"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <RecommendedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/opportunities"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout title="All Opportunities">
                  <DiscoverPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/saved"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <SavedOpportunitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/participations"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ParticipationTrackerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/participations/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ParticipationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/portfolio"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <PortfolioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/teams"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TeamDiscoveryPage />
              </ProtectedRoute>
            }
          />

          {/* Organizer */}
          <Route
            path="/organizer"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <OrganizerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/opportunities"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <OrganizerOpportunitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/opportunities/new"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <OpportunityFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/opportunities/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <OpportunityFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/status"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <OrganizerStatusPage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pending"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPendingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/opportunities"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOpportunitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

