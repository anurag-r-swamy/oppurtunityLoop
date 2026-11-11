# Testing Strategy

## Backend Tests (`server/src/tests/`)
- **Stack**: Vitest + Supertest + `mongodb-memory-server`.
- **Isolation**: `setup.js` starts an isolated in-memory MongoDB instance per test suite and clears all collections in `afterEach`, ensuring zero interaction with development or production databases.
- **Suites**:
  - `auth.test.js`: Registration, admin self-assignment rejection, duplicate email rejection, invalid login, unauthenticated rejection, logout session revocation, student-vs-admin RBAC.
  - `opportunities.test.js`: Search, category/fee filters, expired/unverified exclusion, pagination, organizer cross-ownership rejection.
  - `bookmarks-participation.test.js`: Duplicate bookmark prevention, bookmark deletion, participation ownership enforcement, invalid transition rejection, full status progression.
  - `recommendations.test.js`: Eligible/ineligible/unknown evaluation, expired exclusion, explanation consistency.
  - `organizer-admin.test.js`: Draft creation, self-verify rejection, organizer submit, admin verify + `AuditLog` persistence.
  - `teams-notifications.test.js`: Team capacity limits, full-team rejection, idempotent deduplicated deadline reminders.
- **Run**: `npm --prefix server test`

## Frontend Tests (`client/src/tests/`)
- **Stack**: Vitest + React Testing Library + `@testing-library/user-event` + `jsdom`.
- **Suites**:
  - `AuthPages.test.jsx`: Login and registration form validation.
  - `DiscoverPage.test.jsx`: Opportunity loading, category filtering, bookmark toggle, error-with-retry state, empty state.
  - `StudentWorkflows.test.jsx`: `ExplanationPanel` rendering, `ParticipationDetailPage` status & checklist updates, `ProtectedRoute` role restriction.
- **Run**: `npm --prefix client test`

## Recommendation Evaluation Script
- **Run**: `npm --prefix server run evaluate:recs`

