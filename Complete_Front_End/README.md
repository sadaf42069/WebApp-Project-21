# Navana Bailey Star Management System

A full-stack shopping-complex management application with a React/Vite frontend and a Node.js/Express backend.

Live production site: https://navana-bailey-star.vercel.app

## Implemented Features

- Real admin login with scrypt-hashed passwords and signed, expiring bearer tokens
- Durable public and protected URLs with reload, Back, Forward, and selected-shop deep-link support
- Complete public shop directory, truthful shop details, and responsive floor navigation
- Persistent shop create, read, update, and delete operations
- Complete tenant create, read, update, delete, assignment, and Paid/Due/Overdue controls in the admin interface
- Dashboard activity history backed by real server mutations
- Occupancy, category, floor, and rent summaries
- CSV export and printable reports
- Protected admin API routes and public read-only shop routes
- Server-side input validation and consistent API errors
- Atomic file-backed persistence with a demo-data reset action
- Mobile public navigation and an accessible admin navigation drawer
- Associated form labels, named icon controls, focus-trapped dialogs, Escape dismissal, and reset confirmation
- API, PostgreSQL-adapter, and frontend-route automated tests

The submission-ready SRS is [`docs/Navana-Bailey-Star-SRS-v1.2.docx`](docs/Navana-Bailey-Star-SRS-v1.2.docx). Supporting requirements-engineering evidence, SMART/MoSCoW analysis, traceability, monitoring, risks, and change control are maintained in [`docs/REQUIREMENTS-ENGINEERING.md`](docs/REQUIREMENTS-ENGINEERING.md). The release and presentation checklist is in [`docs/TEST-AND-DEMONSTRATION-PLAN.md`](docs/TEST-AND-DEMONSTRATION-PLAN.md).

## Technology

- Frontend: React 18, TypeScript, Vite 6
- Backend: Node.js 22+, Express 5, native Node.js crypto
- Local storage: JSON database at `server/data/database.json`
- Production storage: Neon PostgreSQL through `DATABASE_URL`
- Tests: built-in `node:test`, HTTP `fetch`, and Node.js TypeScript stripping for pure frontend route tests

Express and the PostgreSQL driver are the backend runtime dependencies. Password hashing, token signing, local file persistence, and tests use built-in Node.js modules.

## Run Locally

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

`npm run dev` starts both services:

- Frontend: `http://localhost:8443`
- Node.js API: `http://localhost:3001`

The frontend development server proxies `/api` requests to the Node.js API.

Initial admin login:

```text
Email: admin@navana.com
Password: Admin@123
```

These credentials are used only when `server/data/database.json` is created for the first time.

## Environment Configuration

Copy `.env.example` to `.env` before first run when you need custom values. The backend reads `.env` using Node.js itself; no dotenv package is required.

Important variables:

- `PORT`: API and production web-server port; default `3001`
- `AUTH_SECRET`: token-signing secret; always change this for deployment
- `AUTH_TOKEN_TTL_SECONDS`: login lifetime; default eight hours
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: first database administrator
- `DATA_FILE`: optional custom database path
- `DATABASE_URL`: Neon PostgreSQL connection string; enables production PostgreSQL persistence
- `CORS_ORIGIN`: optional frontend origin for split-origin deployments
- `VITE_API_URL`: optional absolute frontend API base URL

If the database already exists, changing `ADMIN_EMAIL` or `ADMIN_PASSWORD` does not replace the stored administrator. To intentionally reinitialize all local data and the administrator, stop the server, make a backup if needed, remove `server/data/database.json`, and restart.

## Production Build

```bash
npm run build
npm start
```

After a successful build, the Node.js server hosts the compiled frontend and API together at `http://localhost:3001`.

## Vercel + Neon Deployment

The repository includes the Node.js application entry point at `index.js`, a Vercel Function adapter at `api/index.js`, and deployment settings in `vercel.json`.

Production requires these encrypted Vercel environment variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

When `DATABASE_URL` exists, the backend automatically creates its PostgreSQL application-state table and seeds the initial shops, tenants, activities, and administrator exactly once. Vercel serves the React build and Express API from the same public domain.

## Validation

```bash
npm test
npm run build
npm audit
```

The integration suite covers health checks, login success/failure, public versus protected access, shop CRUD, duplicate validation, rent-status persistence, activity recording, and demo reset.

The full automated gate additionally covers malformed and oversized input, tenant CRUD and occupancy synchronization, reports, expired/malformed tokens, PostgreSQL commit/rollback behavior without live credentials, and durable frontend route/deep-link behavior. Run `npm run test:postgres` separately when a real `DATABASE_URL` is available.

## API Overview

Public routes:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/shops`
- `GET /api/shops/:shopNo`

Authenticated admin routes:

- `GET /api/auth/me`
- `POST /api/shops`
- `PUT /api/shops/:shopNo`
- `DELETE /api/shops/:shopNo`
- `GET|POST /api/tenants`
- `GET|PUT|DELETE /api/tenants/:tenantId`
- `PATCH /api/tenants/:tenantId/payment-status`
- `GET /api/activities`
- `GET /api/reports/summary`
- `POST /api/system/reset`

Send the login token as `Authorization: Bearer <token>` on protected routes.

## Data Notes

The included shop and tenant records are demonstration data. Local development uses a Git-ignored JSON database with atomic writes. Vercel production uses a transactionally locked PostgreSQL JSONB record in Neon, so concurrent mutations remain consistent and data survives deployments and function restarts.

## Responsive and Accessibility Acceptance

Before submission or deployment, verify the browser matrix at 390, 760, 1024, and 1440 CSS pixels. Public and admin navigation must remain reachable; the floor map and shop cards must not cause document overflow; dialogs must trap focus and close with Escape; and every visible form/icon control must have a usable label. The exact scenarios are listed in [`docs/TEST-AND-DEMONSTRATION-PLAN.md`](docs/TEST-AND-DEMONSTRATION-PLAN.md).
