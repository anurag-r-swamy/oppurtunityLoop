# System Architecture

OpportunityLoop follows a modular three-tier MERN architecture separating the React SPA client, stateless Express API layer, and MongoDB persistence layer.

## Component Breakdown

1. **Client (`client/`)**:
   - Built with React 18, Vite, React Router 7, Tailwind CSS v4, Axios, React Hook Form + Zod, Lucide Icons, and Recharts.
   - Organized into `context/` (`AuthContext`, `ToastContext`), `lib/` (`api`, `constants`, `formatters`), `components/` (`common`, `opportunities`, `layout`), and role-grouped `pages/` (`public`, `student`, `organizer`, `admin`).
   - Axios sends `withCredentials: true` and attaches `x-csrf-token` from the `ol_csrf` cookie on mutating requests.

2. **API Server (`server/`)**:
   - `src/app.js` exports `createApp()` so Supertest integration tests run against the exact middleware and route stack without binding a network port.
   - `src/server.js` connects to MongoDB, starts HTTP listening, starts the background `reminderService` interval scheduler, and handles `SIGINT`/`SIGTERM` graceful shutdown.
   - Layered design:
     - `middleware/`: `requestId`, `helmet`, `cors`, `cookieParser`, `sanitizeRequest`, `rateLimiter`, `csrf`, `auth`, `validate`, `errorHandler`.
     - `routes/`: REST endpoints grouped by domain under `/api/v1`.
     - `services/`: `recommendationEngine`, `reminderService`, `auditService`.
     - `models/`: 11 Mongoose schemas with compound indexes and pre-save/pre-validate invariants.

3. **Database (`MongoDB`)**:
   - Stores users, server-side revocable sessions, opportunities, categories, platform settings, bookmarks, participations, team requests, notifications, reports, and audit logs.

