# Test and Demonstration Plan

## Automated release gate

Run:

```bash
npm test
npm run build
npm audit --omit=dev
```

The API suite covers health, authentication success/failure, public/protected access, shop CRUD and conflicts, malformed JSON, oversized bodies, validation errors, tenant CRUD, occupancy synchronization, payment status, activities, report calculations, expired/malformed tokens, and reset. An injected PostgreSQL-adapter suite proves transaction, row-lock, commit, rollback, and release behavior without production credentials. A real `DATABASE_URL` remains necessary for the optional external smoke test.

The frontend route suite covers every page URL, shop deep links, protected login return paths, and open-redirect rejection.

## Browser acceptance matrix

Verify each release at 390, 760, 1024, and 1440 CSS pixels:

1. Reload `/directory`, search and filter, confirm the displayed-card count equals the result count, open shop details, open its floor location, and use browser Back/Forward.
2. On the floor map, switch floors, search a shop, select/clear a cell, open details, and confirm the map and detail panel never create horizontal document overflow.
3. Open `/admin/tenants` without a token and confirm redirect to login; sign in and confirm return to the requested URL.
4. Open and close mobile public/admin navigation; confirm every destination is keyboard reachable.
5. Create, edit, move, delete, and change the status of a temporary tenant; confirm occupancy, summaries, and activities update.
6. Create/edit/delete a temporary vacant shop and verify duplicate and tenanted-shop errors.
7. Use Tab/Shift+Tab and Escape in every dialog; confirm focus remains trapped, close buttons have accessible names, and focus returns to the opener.
8. Print reports, export CSV, cancel reset, then confirm reset only with disposable demonstration data.

## Presentation structure

Use a short problem-to-evidence narrative:

1. Problem and stakeholders: fragmented records, customer discovery, privacy, and management visibility.
2. Elicitation: techniques, preparation, session protocol, evidence confidence, and difficulties.
3. Analysis: SMART objectives, MoSCoW, negotiation decisions, functional/NFR classification, and traceability.
4. Architecture: React/Vite, Express, protected/public API, atomic JSON, and transactional PostgreSQL.
5. Demonstration: durable public route, search/details/floor map, login, tenant CRUD/status, reports, and responsive navigation.
6. Quality evidence: build, automated suites, accessibility behavior, mobile matrix, risks, and change control.
7. Limitations: simplified map, current-status rent model, one admin role, and validation-pending stakeholder policies.

For the individual written/viva component, every team member should be able to explain semantic HTML, CSS layout/breakpoints, React state/effects, History API routing, fetch/authentication, Express middleware/routes, validation, HTTP status codes, JSON/PostgreSQL persistence, transactions, and the difference between functional and nonfunctional requirements.
