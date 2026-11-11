# Known Limitations & Scope Boundaries

## Completed Core Functionality
- Full MERN authentication with `bcryptjs` hashing, MongoDB-backed revocable sessions, `HttpOnly` cookies, and CSRF double-submit verification.
- Role-based access control (`student`, `organizer`, `admin`) enforced at API middleware and route levels.
- Explainable Participation Engine (deterministic eligibility evaluation, weighted 0–100 scoring, reason generation, missing-information detection, and baseline comparison script).
- MongoDB-backed opportunity discovery with search, multi-facet filtering, sorting, and bounded pagination.
- Student bookmarks, participation checklists with validated state transitions, portfolio view, team requests, and in-app deadline reminders.
- Organizer submission workflow and Admin verification, report moderation, user status control, category/settings management, analytics, and audit logs.

## Features Requiring Additional Configuration or Future Work
1. **External Email Delivery**: `reminderService.js` supports SMTP via Nodemailer when `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are configured. Without SMTP credentials, reminders work purely in-app.
2. **External Event Verification**: Admin verification ensures listings are reviewed against provided `officialSourceUrl` metadata by an administrator; OpportunityLoop does not automatically crawl third-party websites or verify external registration receipts.
3. **Self-Reported Outcomes**: Student participation statuses and outcomes are marked `self_reported` unless explicitly confirmed by an organizer integration (which is currently a schema field reserved for future organizer attendance import).
4. **Full-Text Search Synonyms**: Search uses case-insensitive regex/text matching and does not yet expand domain synonyms or abbreviations automatically.
5. **Legal Policies**: `PrivacyPolicyPage` and `TermsOfUsePage` are structured templates with production-readiness notes requiring legal review before public launch.
6. **Local Environment Note**: This workspace machine did not have Docker or a local `mongod` service pre-installed on PATH; backend automated tests were verified against `mongodb-memory-server` 7.0.24.

