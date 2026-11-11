# Deployment Guide

## Environment Configuration
1. **Backend (`server/.env`)**:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI`: Managed MongoDB Atlas connection string with authentication and TLS.
   - `CORS_ORIGIN`: Exact frontend origin(s), comma-separated (e.g. `https://app.yourdomain.com`).
   - `SESSION_SECRET`: Strong random 32+ character secret.
   - `COOKIE_DOMAIN`: Set only if sharing cookies across subdomains; otherwise leave blank for same-origin proxy.
   - `SMTP_*`: Configure if enabling external email reminders.
2. **Frontend (`client/.env`)**:
   - `VITE_API_BASE_URL`: `/api/v1` (when served behind same-domain reverse proxy like Nginx) or full API URL `https://api.yourdomain.com/api/v1`.

## HTTPS, Cookies & CORS
- Serve both frontend and backend over **HTTPS** in production so `HttpOnly` + `Secure` cookies are transmitted securely.
- Prefer a single-origin reverse proxy (e.g. Nginx or platform routing `/api/*` → Express, `/*` → Vite `dist/`) to avoid third-party cookie restrictions with `SameSite=Lax`.
- If frontend and API reside on different domains, configure TLS on both, set `CORS_ORIGIN` to the exact frontend URL, and review cookie `SameSite` policy.

## Build & Run Commands
- **Frontend production build**: `npm --prefix client run build` (outputs static assets to `client/dist/`).
- **Backend production start**: `npm --prefix server start`.
- **Docker Compose**: `docker compose up --build -d` (runs `mongo:7.0` with persistent `mongo_data` volume, `server`, and `client` Nginx container).

## Backup & Migration Considerations
- Schedule automated MongoDB backups (`mongodump` or MongoDB Atlas continuous snapshots) before schema changes.
- Keep index definitions synchronized via Mongoose startup or dedicated migration scripts when introducing new unique constraints.
- Never bake `.env` files into Docker images (`server/Dockerfile` and `client/Dockerfile` only copy source and build artifacts).

