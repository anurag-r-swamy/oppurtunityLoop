# REST API Specification (`/api/v1`)

All endpoints return JSON in a consistent envelope:
- Success: `{ "success": true, "data": { ... } }`
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": [...] }, "requestId": "..." }`

Mutating requests (`POST`, `PATCH`, `PUT`, `DELETE`) with active session cookies require the `x-csrf-token` header matching the `ol_csrf` cookie.

## Health & Metadata
- `GET /api/v1/health` — Returns service health and MongoDB connection status (`200` or `503`).
- `GET /api/v1/meta/public` — Active categories and public platform settings.

## Authentication
- `GET /api/v1/auth/csrf-token` — Issues/returns CSRF token cookie.
- `POST /api/v1/auth/register` — Registers a `student` or `organizer` (never `admin`). Rate-limited.
- `POST /api/v1/auth/login` — Authenticates user and sets `HttpOnly` `ol_session` cookie. Rate-limited.
- `POST /api/v1/auth/logout` — Revokes server session record and clears cookie.
- `GET /api/v1/auth/me` — Returns current authenticated user.

## Student Profile & Dashboard
- `GET /api/v1/users/me` — Current user profile.
- `PATCH /api/v1/users/me` — Update profile, academic info, skills, interests, and notification preferences.
- `GET /api/v1/users/me/dashboard` — Student-only aggregated dashboard metrics and upcoming deadlines.

## Opportunities (Public Discovery & Core CRUD)
- `GET /api/v1/opportunities` — Paginated search & filter (`q`, `category`, `mode`, `feeType`, `state`, `degreeLevel`, `discipline`, `course`, `year`, `deadlineBefore`, `beginnerFriendly`, `includeExpired`, `sort`, `page`, `limit`). Public users only receive `verified` + `published` (or `expired` when `includeExpired=true`).
- `GET /api/v1/opportunities/:id` — Details by ID or slug; includes bookmark state, participation state, and recommendation `explanation` for authenticated students.
- `POST /api/v1/opportunities` — Organizer/Admin create draft listing.
- `PATCH /api/v1/opportunities/:id` — Owner/Admin update listing (organizer edits on verified listings revert status to `needs_review`).
- `DELETE /api/v1/opportunities/:id` — Owner (drafts only) or Admin delete.

## Bookmarks
- `GET /api/v1/bookmarks` — List authenticated user's saved opportunities.
- `POST /api/v1/opportunities/:id/bookmark` — Save bookmark (`409` on duplicate).
- `DELETE /api/v1/opportunities/:id/bookmark` — Remove bookmark.

## Participation Tracker
- `GET /api/v1/participations` — List student's participation records (optional `?status=`).
- `POST /api/v1/opportunities/:id/participation` — Start tracking with default/custom checklist.
- `GET /api/v1/participations/:id` — Owner-only read.
- `PATCH /api/v1/participations/:id` — Owner-only update with validated state transitions (`PARTICIPATION_TRANSITIONS`).
- `DELETE /api/v1/participations/:id` — Owner-only delete.

## Recommendations (Explainable Participation Engine)
- `GET /api/v1/recommendations` — Student-only ranked opportunities with `explanation` (`includeIneligible`, `page`, `limit`).
- `GET /api/v1/recommendations/:opportunityId/explanation` — Student-only detailed explanation for a single opportunity.

## Team Requests
- `GET /api/v1/team-requests` — Filterable by `opportunityId`, `status`, `mine`, `skill`.
- `POST /api/v1/team-requests` — Student creates team request for multi-member opportunity.
- `GET /api/v1/team-requests/:id` — Team detail (hides private pending requests of other students from non-leaders).
- `PATCH /api/v1/team-requests/:id` — Leader-only edit/close.
- `POST /api/v1/team-requests/:id/invitations` — Leader invites `targetUserId` or student submits join request.
- `POST /api/v1/team-requests/:id/respond` — Authorized `accepted` / `rejected` / `withdrawn` response; enforces capacity and auto-transitions to `full`.
- `POST /api/v1/team-requests/:id/leave` — Member leaves open/full team.

## Notifications
- `GET /api/v1/notifications` — List user notifications and unread count.
- `PATCH /api/v1/notifications/:id/read` — Mark single notification read.
- `POST /api/v1/notifications/read-all` — Mark all notifications read.
- `POST /api/v1/notifications/check-deadlines` — Trigger reminder evaluation for current deadlines.

## Organizer Workflow
- `GET /api/v1/organizer/dashboard` — Organizer stats and recent submissions.
- `GET /api/v1/organizer/opportunities` — Organizer's own listings.
- `GET /api/v1/organizer/opportunities/:id` — Single listing (ownership enforced).
- `POST /api/v1/organizer/opportunities` — Create draft listing.
- `PATCH /api/v1/organizer/opportunities/:id` — Edit own listing.
- `POST /api/v1/organizer/opportunities/:id/submit` — Submit listing for admin verification.

## Reports & Administration
- `POST /api/v1/reports` — Authenticated user submits issue report.
- `GET /api/v1/admin/dashboard` — Admin stats and category distribution.
- `GET /api/v1/admin/opportunities/pending` — Pending/needs-review queue.
- `GET /api/v1/admin/opportunities` — All listings.
- `PATCH /api/v1/admin/opportunities/:id/verify` — Verify & publish listing + audit log.
- `PATCH /api/v1/admin/opportunities/:id/reject` — Reject / request revision with reason + audit log.
- `PATCH /api/v1/admin/opportunities/:id/archive` — Archive listing + audit log.
- `POST /api/v1/admin/opportunities/mark-expired` — Expire past-deadline listings + audit log.
- `GET /api/v1/admin/reports` & `PATCH /api/v1/admin/reports/:id` — Moderation reports.
- `GET /api/v1/admin/users` & `PATCH /api/v1/admin/users/:id/status` — User account status management.
- `GET/POST/PATCH /api/v1/admin/categories` — Category management.
- `GET/PATCH /api/v1/admin/settings` — Global platform settings.
- `GET /api/v1/admin/analytics/participation` — Category, discipline, and status aggregations.
- `GET /api/v1/admin/audit-logs` — Sensitive action audit trail.

