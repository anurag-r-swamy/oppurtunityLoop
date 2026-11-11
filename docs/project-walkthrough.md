# OpportunityLoop — Complete Project & Module Walkthrough

This document summarizes everything built in the **OpportunityLoop** MERN application so far and explains each backend, database, frontend, testing, DevOps, and documentation module in detail.

---

## 1. High-Level Overview

**OpportunityLoop** (*Discover. Participate. Grow.*) is a full-stack MERN student opportunity and participation hub built for college students across India across **all academic disciplines** (Engineering & Technology, MCA/CS/IT, Science & Research, Commerce & Management, Arts & Humanities, Law, Design & Media, Medicine & Allied Disciplines, Education, and Other UG/PG programs).

Key pillars implemented:
1. **Explainable Participation Engine** (deterministic eligibility evaluation + weighted scoring + transparent explanations + missing-data reporting).
2. **MongoDB-Backed Opportunity Discovery** (search, multi-facet filters, sorting, pagination, bookmarking).
3. **End-to-End Participation Tracking** (checklists, validated status state machine, achievement portfolio distinguishing `self_reported` vs `organizer_confirmed`).
4. **Role-Based Workspaces** (`student`, `organizer`, `admin`) enforced on both Express API middleware and React routes.
5. **Team Discovery & Deadline Reminders** (capacity-enforced team requests + idempotent in-app/SMTP reminders).

---

## 2. Backend Modules (`server/src/`)

### 2.1 Entry & App Composition
- **`server/src/app.js` (`createApp`)**: Configures and returns the Express application without binding a port so Supertest integration tests run directly against the real middleware/route stack. Wires `trust proxy`, `requestIdMiddleware`, `helmet`, `cors` (env allowlist), `express.json`/`urlencoded` (1 MB limit), `cookieParser`, `sanitizeRequest`, `apiLimiter`, `verifyCsrf`, all `/api/v1/*` routers, `notFoundHandler`, and `errorHandler`.
- **`server/src/server.js`**: Connects to MongoDB via `connectDB()`, starts the Express HTTP server on `env.PORT`, starts the background deadline/expiry scheduler (`startReminderScheduler()`), and handles `SIGINT`/`SIGTERM` graceful shutdown.

### 2.2 Configuration (`server/src/config/`)
- **`env.js`**: Loads `.env` with `dotenv` and validates all environment variables via Zod (`NODE_ENV`, `PORT`, `CORS_ORIGIN`, `MONGODB_URI`, `SESSION_SECRET`, `SESSION_TTL_DAYS`, `COOKIE_DOMAIN`, `AUTH_RATE_LIMIT_MAX`, `API_RATE_LIMIT_MAX`, `REMINDER_INTERVAL_MINUTES`, `SMTP_*`). Exits immediately if production runs with the dev default `SESSION_SECRET`.
- **`db.js`**: Exports `connectDB`, `disconnectDB`, and `getDBStatus` for Mongoose connection lifecycle and `/api/v1/health` reporting.
- **`constants.js`**: Centralizes domain enums and config: `USER_ROLES`, `ACADEMIC_DISCIPLINES`, `DEGREE_LEVELS`, `EXPERIENCE_LEVELS`, `EVENT_MODES`, `OPPORTUNITY_CATEGORIES`, `VERIFICATION_STATUSES`, `PUBLICATION_STATUSES`, `PARTICIPATION_STATUSES`, `PARTICIPATION_TRANSITIONS`, `REPORT_REASONS`, `REPORT_STATUSES`, `INDIAN_STATES`, and `RECOMMENDATION_WEIGHTS` (v1, summing to 100).

### 2.3 Security & Request Middleware (`server/src/middleware/`)
- **`auth.js`**:
  - Implements server-tracked cookie sessions (`ol_session`, `HttpOnly`, `SameSite=Lax`, `Secure` in production).
  - `createSession` generates a 32-byte random token, stores its HMAC-SHA256 digest (`hashSessionToken`) in MongoDB `Session`, and sets the cookie.
  - `authenticate` and `optionalAuth` validate active, non-revoked, non-expired sessions and `active` user accounts.
  - `requireRole(...roles)` enforces role-based access (`401` / `403`).
- **`csrf.js`**: Double-submit CSRF protection (`ol_csrf` cookie + `x-csrf-token` header validation via `verifyCsrf` on mutating requests when a session or CSRF cookie is present).
- **`validate.js`**: Generic Zod middleware (`validate({ params, query, body })`) parsing and replacing request inputs before handlers run.
- **`sanitize.js`**: Recursively strips keys starting with `$` or containing `.` from `req.body`, `req.query`, and `req.params` to prevent NoSQL operator injection.
- **`rateLimiter.js`**: Configures `authLimiter` and `apiLimiter` via `express-rate-limit`.
- **`requestId.js`**: Attaches `X-Request-Id` correlation headers and emits structured JSON request logs outside `test` mode.
- **`errorHandler.js`**: Defines `AppError`, `notFoundHandler` (`404`), and `errorHandler` mapping Zod, Mongoose `ValidationError`/`CastError`, duplicate key (`11000`), and JSON parse errors into structured envelopes `{ success: false, error: { code, message, details? }, requestId }`, hiding stack traces in production.

### 2.4 Data Models (`server/src/models/`)
- **`User.js`**: Stores credentials (`email` normalized unique, `passwordHash` with `select: false`), `role`, `accountStatus`, `studentProfile` (auto-calculates `profileCompletionStatus` in `pre('save')` via `computeProfileCompletion`), `organizerProfile`, and `notificationPreferences`.
- **`Session.js`**: Stores hashed session tokens with TTL index (`expireAfterSeconds: 0`) on `expiresAt` and `revokedAt` for logout invalidation.
- **`Opportunity.js`**: Stores listings, `slug` (unique), `officialSourceUrl`, `registrationUrl`, `eventMode`, `location`, `eligibilityRules`, `feeAmount`/`feeCurrency`, `deadline`, `eventStartDate`, `eventEndDate`, `teamSize`, `requiredSkills`, `beginnerFriendly`, `defaultChecklist`, `isDemoData`, `verificationStatus`, `publicationStatus`, and moderation metadata. Validates date ordering, team-size bounds, and age bounds in `pre('validate')`, with compound and full-text indexes.
- **`Bookmark.js`**: `userId` + `opportunityId` with unique compound index preventing duplicate saves.
- **`Participation.js`**: Tracks student progress (`status`, `preparationChecklist`, `registrationUrl`, timestamps, `outcome`, `evidenceUrl`, `verificationOrigin`, `personalNotes`) with a unique compound index on `(userId, opportunityId)`.
- **`TeamRequest.js`**: Opportunity-linked team listings (`members`, `requests` for `join_request` / `leader_invite`, `maximumMembers`, `requestStatus`: `open` | `full` | `closed`).
- **`Notification.js`**: Stores reminders and team/listing alerts with a partial unique index on `(userId, relatedOpportunityId, reminderWindowKey)` to guarantee idempotent deadline reminders.
- **`Report.js`**: Student-submitted listing quality/abuse reports (`reason`, `description`, `status`, `resolutionNote`, `reviewedBy`, `reviewedAt`).
- **`AuditLog.js`**: Immutable audit trail for admin actions (`actorId`, `action`, `entityType`, `entityId`, sanitized `metadata`, `timestamp`).
- **`Category.js`** & **`PlatformSetting.js`**: Admin-configurable category taxonomy and global flags (`teamMatchingEnabled`, `requireAdminVerification`, `defaultReminderDays`, `maintenanceBanner`).

### 2.5 Core Services (`server/src/services/`)
- **`recommendationEngine.js` (Explainable Participation Engine)**:
  - `evaluateEligibility(studentProfile, opportunity, now)`: Evaluates publication status, deadline, discipline, degree level, course, year, state, and age. Explicitly marks `unknown` (never `eligible`) when organizer academic rules or required student profile fields are missing.
  - `scoreOpportunityForStudent(user, opportunity, weights, now)`: Scores `0–100` across `interests` (25), `skills` (25), `academicRelevance` (20), `beginnerSuitability` (10), `modePreference` (10), `locationPreference` (5), and `deadlineFeasibility` (5), returning `reasons`, `ineligibilityReasons`, `missingInformation`, `nextActions`, `scoreBreakdown`, `verificationMetadata`, and `scoreVersion`.
  - `rankOpportunitiesForStudent(...)`: Filters out `ineligible` and expired listings by default and ranks `eligible` ahead of `unknown`, then by score descending and deadline ascending.
- **`reminderService.js`**:
  - `markExpiredOpportunities()`: Transitions past-deadline `published` listings to `expired`.
  - `generateDeadlineReminders()`: Checks bookmarks and active participations within 7 days of deadline, respects user `notificationPreferences`, creates deduplicated `Notification` documents, and optionally dispatches emails via Nodemailer when `SMTP_*` env vars are configured.
  - `startReminderScheduler()`: Runs periodic checks via `setInterval` (`timer.unref()`).
- **`auditService.js`**: `recordAuditLog()` strips any sensitive keys (`password`, `passwordHash`, `token`, `session`) before writing to `AuditLog`.

### 2.6 Validators & REST Routes (`server/src/validators/` & `server/src/routes/`)
- **Validators**: `auth.validators.js` (restricts public signup to `student` | `organizer`), `user.validators.js`, `opportunity.validators.js` (enforces `http(s)://` URLs and bounded pagination), `participation.validators.js`, `teamRequest.validators.js`, `admin.validators.js`.
- **Routes mounted under `/api/v1`**:
  - `health.routes.js`: `/health`, `/meta/public`
  - `auth.routes.js`: `/auth/csrf-token`, `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`
  - `user.routes.js`: `/users/me`, `/users/me/dashboard`
  - `opportunity.routes.js`: `GET/POST/PATCH/DELETE /opportunities` with MongoDB filtering, sorting, pagination, and ownership checks
  - `bookmark.routes.js`: `GET /bookmarks`, `POST/DELETE /opportunities/:id/bookmark`
  - `participation.routes.js`: `GET/POST/PATCH/DELETE /participations` with ownership & `PARTICIPATION_TRANSITIONS` enforcement
  - `recommendation.routes.js`: `GET /recommendations`, `GET /recommendations/:opportunityId/explanation`
  - `teamRequest.routes.js`: `/team-requests` CRUD, invitations/join requests, authorized responses, capacity/closure guards, and leave flow
  - `notification.routes.js`: `/notifications`, read toggles, and `/notifications/check-deadlines`
  - `organizer.routes.js`: `/organizer/dashboard`, `/organizer/opportunities`, submit-for-review (never self-verifies)
  - `report.routes.js`: `POST /reports`
  - `admin.routes.js`: `/admin/dashboard`, verification queue (`verify`/`reject`/`archive`/`mark-expired`), reports, user suspension, categories, settings, participation analytics aggregations, and audit logs.

### 2.7 CLI Scripts (`server/src/scripts/`)
- **`seed.js`**: Idempotently seeds 10 categories, global settings, demo student/organizer accounts (`example.com`), and 10 clearly labelled `[Demo]` opportunities across hackathons, coding contests, research, case competitions, quizzes, debates, design challenges, cultural events, workshops, and an expired fellowship sample.
- **`createDevAdmin.js`**: Local-only script creating/updating an admin account strictly from `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD` env vars (refuses `NODE_ENV=production`).
- **`resetDevData.js`**: Clears collections for local resets (refuses `NODE_ENV=production`).
- **`evaluateRecommendations.js`**: Runs reproducible evaluation comparing personalized ranking against a chronological deadline baseline and testing controlled `eligible`/`ineligible`/`unknown`/missing-data/expired cases.

---

## 3. Frontend Modules (`client/src/`)

### 3.1 Core App, Routing & Context
- **`client/src/main.jsx`** & **`client/src/index.css`**: Mounts React root and imports Tailwind CSS v4 with accessible `:focus-visible` outlines.
- **`client/src/App.jsx`**: Configures `ErrorBoundary`, `BrowserRouter`, `ToastProvider`, `AuthProvider`, and `AppRoutes` with eager public entry routes and `React.lazy` + `Suspense` route-level code splitting for secondary, student, organizer, and admin pages.
- **`client/src/lib/api.js`**: Axios client configured with `withCredentials: true`, automatic `x-csrf-token` header injection from `ol_csrf` cookie, automatic CSRF token refresh & retry on `403 CSRF_INVALID`, and `getApiErrorMessage()`.
- **`client/src/lib/constants.js`** & **`formatters.js`**: Shared academic options, Indian states, status transition maps, date/countdown/INR fee/category label formatters.
- **`client/src/context/AuthContext.jsx`** & **`ToastContext.jsx`**: Global session user bootstrap (`/auth/me` + `/meta/public`), login/register/logout actions, and accessible toast notifications (`role="status"`).

### 3.2 Reusable Components (`client/src/components/`)
- **`common/`**: `Navbar.jsx` (responsive + maintenance banner + role-aware links), `Footer.jsx`, `ProtectedRoute.jsx` (auth & role enforcement), `ErrorBoundary.jsx`, `SkeletonCard.jsx`, `EmptyState.jsx`, `StatusBadge.jsx`, `Pagination.jsx`.
- **`layout/DashboardLayout.jsx`**: Role-specific sidebar workspace layout for Student, Organizer, and Admin sections.
- **`opportunities/`**: `OpportunityCard.jsx`, `OpportunityFilters.jsx` (keyword, category, mode, fee, discipline, degree, state, beginner-friendly, historical expired toggle, sort), `ExplanationPanel.jsx` (eligibility badge, score, match reasons, missing info warnings, breakdown grid, next steps), `ReportModal.jsx`.

### 3.3 Pages (`client/src/pages/`)
- **Public (`pages/public/`)**:
  - `LandingPage.jsx`: Mission hero, search bar, category shortcuts, live upcoming opportunities from API, Explainable Engine overview, beginner benefits, journey preview, student & organizer CTAs.
  - `DiscoverPage.jsx`: URL-synced filters, bookmarking, skeletons, retryable error states, empty states, pagination.
  - `OpportunityDetailPage.jsx`: Full event metadata, source/registration links, eligibility rules, `ExplanationPanel`, track-with-checklist button, bookmarking, and `ReportModal`.
  - `LoginPage.jsx` & `RegisterPage.jsx`: React Hook Form + Zod validation (`student` or `organizer` signup).
  - `PrivacyPolicyPage.jsx`, `TermsOfUsePage.jsx`, `NotFoundPage.jsx`.
- **Student (`pages/student/`)**:
  - `StudentDashboardPage.jsx`, `ProfilePage.jsx`, `RecommendedPage.jsx`, `SavedOpportunitiesPage.jsx`, `ParticipationTrackerPage.jsx`, `ParticipationDetailPage.jsx` (status transition dropdown + checklist editor + outcome/evidence URL), `PortfolioPage.jsx`, `NotificationsPage.jsx`, `TeamDiscoveryPage.jsx`.
- **Organizer (`pages/organizer/`)**:
  - `OrganizerDashboardPage.jsx`, `OrganizerOpportunitiesPage.jsx`, `OpportunityFormPage.jsx` (create & edit form), `OrganizerStatusPage.jsx`.
- **Admin (`pages/admin/`)**:
  - `AdminDashboardPage.jsx` (database stats + Recharts bar chart), `AdminPendingPage.jsx` (verify/reject queue), `AdminOpportunitiesPage.jsx` (archive + mark expired), `AdminReportsPage.jsx`, `AdminUsersPage.jsx`, `AdminCategoriesPage.jsx` (categories + platform settings), `AdminAnalyticsPage.jsx` (Recharts category/discipline charts), `AdminAuditLogsPage.jsx`.

---

## 4. Testing Modules

- **Backend (`server/src/tests/` — Vitest + Supertest + `mongodb-memory-server`)**:
  - `setup.js` & `helpers.js`: Isolated in-memory MongoDB setup and test agent/CSRF helpers.
  - `auth.test.js` (6 tests), `opportunities.test.js` (2 tests), `bookmarks-participation.test.js` (2 tests), `recommendations.test.js` (1 test), `organizer-admin.test.js` (1 test), `teams-notifications.test.js` (2 tests).
  - Verified result: **6 test files passed, 14 tests passed**.
- **Frontend (`client/src/tests/` — Vitest + React Testing Library + `jsdom`)**:
  - `setup.js` & `testUtils.jsx`
  - `AuthPages.test.jsx` (2 tests), `DiscoverPage.test.jsx` (2 tests), `StudentWorkflows.test.jsx` (3 tests).
  - Verified result: **3 test files passed, 7 tests passed**.

---

## 5. DevOps, Build & Documentation Files

- **Containerization & CI**: `docker-compose.yml` (MongoDB 7.0 + Express API + Nginx React client), `server/Dockerfile`, `client/Dockerfile`, `client/nginx.conf`, `.github/workflows/ci.yml`.
- **Environment Templates & Ignore**: `.env.example`, `server/.env.example`, `client/.env.example`, `.gitignore`.
- **Production Build**: `client` Vite build configured with `manualChunks` (`vendor`, `charts`) and lazy route chunks (`index` bundle 163.42 kB, zero oversized chunk warnings).
- **Documentation (`docs/` & `README.md`)**: `README.md`, `architecture.md`, `database-schema.md`, `api-specification.md`, `security.md`, `recommendation-engine.md`, `testing.md`, `deployment.md`, `known-limitations.md`, and this `project-walkthrough.md`.

