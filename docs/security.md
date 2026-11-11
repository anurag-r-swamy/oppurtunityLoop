# Security Architecture

## Authentication & Session Management
- **Password Hashing**: Passwords are hashed using `bcryptjs` with a work factor of `12` (`hash` stored in `passwordHash`, excluded from queries via `select: false`).
- **Server-Tracked Sessions**: Upon login or registration, the server generates a 256-bit random session token, stores its HMAC-SHA256 digest (`SESSION_SECRET`) in the MongoDB `sessions` collection with an `expiresAt` TTL index, and sets an `HttpOnly`, `SameSite=Lax` cookie (`ol_session`, with `Secure: true` in `NODE_ENV=production`).
- **No `localStorage` Tokens**: Long-lived tokens are never written to `localStorage` or `sessionStorage`.
- **Safe Logout**: `POST /api/v1/auth/logout` revokes the `Session` document (`revokedAt`) in MongoDB and clears the cookie.

## CSRF Protection
- Double-submit cookie mechanism: `GET /api/v1/auth/csrf-token` (and `/auth/me`) issues a readable `ol_csrf` cookie (`SameSite=Lax`).
- All mutating requests (`POST`, `PATCH`, `PUT`, `DELETE`) when a session/CSRF cookie is active must include matching `x-csrf-token` header values.

## Authorization & Input Hardening
- **Role-Based Access Control**: `requireRole(...)` enforces `student`, `organizer`, and `admin` permissions on every protected route.
- **No Self-Assigned Admin**: Public `POST /api/v1/auth/register` validates `role` strictly against `['student', 'organizer']`.
- **Ownership Checks**: Students can only read/write their own participations and bookmarks; organizers can only edit/submit their own opportunities and cannot self-verify.
- **Request Validation & NoSQL Injection Protection**: Every input body/query/params is validated with Zod (`validate()`), and `sanitizeRequest` recursively strips keys starting with `$` or containing `.`.
- **URL Validation**: `officialSourceUrl`, `registrationUrl`, and `evidenceUrl` require `http://` or `https://` schemes.
- **HTTP Hardening**: `helmet`, `cors` (origin allowlist from `CORS_ORIGIN`), `express-rate-limit` on `/auth` and `/api/v1`, 1MB body limits, and production error redaction (stack traces never returned when `NODE_ENV=production`).

## Security Assumptions
- Production deployments must run behind HTTPS termination so `Secure` cookies and `Strict-Transport-Security` protect session cookies in transit.
- `SESSION_SECRET` must be set to a unique high-entropy secret in production (startup fails if left on the development default when `NODE_ENV=production`).

