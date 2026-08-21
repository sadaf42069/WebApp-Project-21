# Requirements Engineering Baseline

Version 1.2.0 - 21 August 2026

This document records the elicitation and analysis evidence behind the current implementation. It exists so that feature claims, code, verification, risks, and future changes remain traceable. It does not invent stakeholder quotations: the original questionnaire response sheets were not retained, so business decisions that require an authorized shopping-complex representative remain validation pending.

## 1. Elicitation approach

### Evidence sources

| ID | Evidence | Use | Confidence |
| --- | --- | --- | --- |
| EV-01 | Earlier SRS and its questionnaire themes | Original problems, actors, and proposed scope | Medium; raw responses unavailable |
| EV-02 | Current React, Express, JSON, and PostgreSQL implementation | Feasibility, behavior, data model, interfaces, and gaps | High |
| EV-03 | Automated API, PostgreSQL-adapter, route, build, and browser checks | Acceptance evidence | High for covered paths |
| EV-04 | Evaluator feedback | Required stronger elicitation and requirement analysis | High |
| EV-05 | CSE309 template and evaluation criteria | Required document structure and analysis topics | High |

### Stakeholders

| Stakeholder | Primary needs | Validation method |
| --- | --- | --- |
| Shopping-complex administrator | Accurate shop/tenant/rent information, reports, privacy, and recoverability | Scenario walkthrough and sign-off |
| Management operator | Fast CRUD, useful feedback, and safe destructive actions | Task observation and error-path review |
| Tenant/shop representative | Correct public shop information and protected tenancy data | Record review with privacy boundary confirmation |
| Customer/visitor | No-login search, complete results, durable URLs, and usable floor navigation | Desktop/mobile task observation |
| Developer/QA team | Atomic requirements, stable interfaces, traceability, and regression tests | Code, build, API, and browser verification |
| Course evaluator | Evidence of elicitation, analysis, prioritization, specification, and working value | Rubric-based document and demonstration review |

### Technique and preparation

The team uses four complementary techniques:

1. Semi-structured stakeholder sessions using open questions followed by scenario probes.
2. Document analysis of the earlier SRS, rubric, source, API, and test evidence.
3. Prototype-based elicitation using directory, map, management, and report walkthroughs.
4. Interface/code analysis to stop the specification from claiming behavior the architecture does not provide.

Before a session, identify participants and decision authority; review this baseline and the current prototype; prepare representative shop, tenant, rent, privacy, navigation, reporting, error, and mobile scenarios; define the privacy boundary; and prepare a decision log, conflict log, MoSCoW sheet, and requirement IDs.

The session protocol is:

1. **Introduction:** explain purpose, participant role, academic use, privacy limits, duration, and note-taking consent.
2. **Body:** ask current-process questions, probe exceptions, walk scenarios, confirm data fields, explore quality expectations, and prioritize outcomes.
3. **Close:** summarize agreed needs and exclusions in neutral language and ask what was missed.
4. **Follow-up:** circulate the summary and trace mapping; record corrections, decisions, approvals, and open issues.

### Elicitation difficulties and mitigations

| Difficulty | Effect | Mitigation |
| --- | --- | --- |
| Original raw notes were not retained | Sources cannot be independently quoted | Label confidence, retain the reconstructed trace, and require stakeholder revalidation |
| Real tenant/rent data is private | Real edge cases may be underspecified | Use academic seed data and validate rules with an authorized representative |
| No authoritative architectural floor plan | Exact placement cannot be guaranteed | Label the current map as simplified and keep the official plan as a TBD |
| Earlier feature language exceeded the implementation | SRS-to-code drift | Use atomic requirements, implementation status, route/API checks, and baseline review |
| Course time is limited | Uncontrolled scope weakens the core | Protect Must requirements with MoSCoW and defer unrelated mall features |

## 2. Analysis and negotiation

### SMART objectives

| ID | Specific outcome | Measure | Time bound | Status |
| --- | --- | --- | --- | --- |
| OBJ-01 | Centralize shop, tenant, and current rent-status records | Required records survive reload/restart; protected writes reject anonymous users | Release 1.2 demonstration | Implemented |
| OBJ-02 | Let a visitor find a shop and open its location | All matching results are accessible; selected shops have durable detail and floor URLs | Release 1.2 demonstration | Implemented; timed usability validation pending |
| OBJ-03 | Give management current occupancy and rent summaries | Dashboard/report totals equal persisted shop and tenant records | Release 1.2 demonstration | Implemented and API-tested |
| OBJ-04 | Protect private and administrative operations | Tenant, activity, report, reset, and mutation routes reject missing/expired tokens | Before deployment | Implemented and tested |
| OBJ-05 | Provide a reproducible, maintainable build | Strict TypeScript and production build pass; automated suites pass | Before submission | Implemented |
| OBJ-06 | Support 390-1440 CSS-pixel layouts | No document overflow; public/admin navigation and primary actions remain reachable | Before demonstration | Implemented; browser matrix required for each release |
| OBJ-07 | Make core forms and dialogs operable without a mouse | Labels, accessible names, dialog semantics, Escape dismissal, and focus trapping are present | Before demonstration | Implemented; assistive-technology review pending |

### MoSCoW scope

| Priority | Capabilities | Decision reason |
| --- | --- | --- |
| Must | Authentication; protected tenant/rent data; complete public directory; durable routes; floor map; shop CRUD; tenant CRUD; payment status; persistence; validation; accurate summaries; mobile navigation | Without these, the central management and customer-location problems are not solved |
| Should | Accessible dialog behavior; responsive administration; activity history; printable/CSV reports; broader negative-path tests | High evaluation and operational value, while the core can run without an individual item |
| Could | Bangla interface; notifications; richer configurable map landmarks; additional roles | Useful after the verified core and quality targets are stable |
| Won't in 1.2 | Online payment; parking; loyalty; promotions; real-time positioning; audited accounting; customer accounts | External dependencies or weak relevance to the assessed release |

### Negotiated decisions

- Public convenience vs privacy: publish shop records only; keep tenants, rent, activities, reports, reset, and mutations protected.
- Multiple roles vs implemented authorization: release 1.2 has one Administrator role; additional roles require a future authorization model.
- Rent ledger vs current model: store current rent, due date, and payment status; do not claim transaction-history or accounting behavior.
- Exact plan vs unavailable plan: use a clearly simplified map until an approved plan is supplied.
- Feature breadth vs course schedule: complete and test the Must scope before optional shopping-complex features.
- Local vs production persistence: preserve one application service contract with atomic JSON locally and transactional PostgreSQL in production.

## 3. Requirements baseline

Functional requirements describe observable services or state changes. Nonfunctional requirements describe measurable quality or constraints. Business rules constrain both.

| ID | Requirement | Priority | Evidence | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| FR-AUTH-01 | The system shall authenticate the configured administrator and issue an expiring signed token. | Must | EV-02, OBJ-04 | Login/API tests | Implemented |
| FR-AUTH-02 | Protected screens and APIs shall reject missing, malformed, or expired tokens. | Must | EV-02, OBJ-04 | Negative API tests | Implemented |
| FR-DIR-01 | The public directory shall display every shop matching the keyword, category, and floor filters. | Must | OBJ-02 | Result-count and browser check | Implemented |
| FR-DIR-02 | A public shop shall have a durable details URL and a durable floor-location URL. | Must | OBJ-02 | Route tests and browser back/reload | Implemented |
| FR-NAV-01 | A visitor shall select floors, search shops, select map cells, and inspect truthful shop data. | Must | OBJ-02 | Browser scenario | Implemented |
| FR-SHP-01 | An administrator shall create, list, search, filter, update, locate, and conditionally delete shops. | Must | EV-01, EV-02 | API and UI scenarios | Implemented |
| FR-TEN-01 | An administrator shall create, list, search, filter, inspect, update, and delete tenant records. | Must | EV-01, EV-02 | API and UI scenarios | Implemented |
| FR-TEN-02 | Tenant assignment shall require an existing unassigned shop and synchronize shop occupancy. | Must | EV-02 | Conflict and occupancy tests | Implemented |
| FR-TEN-03 | An administrator shall set Paid, Due, or Overdue from the tenant interface. | Must | EV-01, EV-02 | API and UI scenarios | Implemented |
| FR-REP-01 | Dashboard and reports shall calculate occupancy and current rent summaries from persisted records. | Must | OBJ-03 | API calculation tests | Implemented |
| FR-REP-02 | Reports shall offer print and complete shop CSV export actions. | Should | EV-01 | Print/download inspection | Implemented |
| FR-SYS-01 | Reset shall require authentication, explicit confirmation, and restore the academic seed state. | Should | EV-02 | Reset API/UI test | Implemented |
| NFR-SEC-01 | Passwords shall use salted scrypt hashes; tokens shall use HMAC-SHA256, expiry, and timing-safe verification. | Must | EV-02 | Code and negative tests | Implemented |
| NFR-PRI-01 | Public responses shall not expose tenant, rent, user, activity, report, or secret data. | Must | OBJ-04 | Public API inspection | Implemented |
| NFR-REL-01 | Local writes shall be queued, temporary-file based, and atomically renamed; PostgreSQL writes shall use a transaction and row lock. | Must | EV-02 | API tests and injected adapter tests | Implemented |
| NFR-USA-01 | At 390-1440 CSS pixels, primary navigation/actions shall remain reachable with no document overflow. | Must | OBJ-06 | Responsive browser matrix | Implemented; regression verification required |
| NFR-USA-02 | Form controls and icon-only buttons shall have accessible names; dialogs shall trap focus and support Escape dismissal. | Should | OBJ-07 | Source audit and keyboard scenario | Implemented; AT review pending |
| NFR-MNT-01 | Strict TypeScript and the Vite production build shall complete without errors. | Must | OBJ-05 | `npm run build` | Implemented |
| NFR-TST-01 | Automated tests shall cover authentication, malformed/oversized input, shop and tenant CRUD, occupancy, reports, token expiry, reset, routes, and PostgreSQL transaction behavior. | Must | OBJ-05 | `npm test` | Implemented |

Business rules: shop numbers and tenant IDs are unique after uppercase normalization; one tenant references one existing shop; no two tenants share a shop; a tenanted shop cannot be deleted; removing/moving a tenant updates occupancy; payment status is Paid, Due, or Overdue; numeric amounts are finite and non-negative; protected data is never public.

## 4. Monitoring, risk, and change control

Monitor `/api/health`, 5xx logs without sensitive fields, the latest 100 activity records, release build/test results, responsive browser results, and production `AUTH_SECRET`, HTTPS, CORS, and `DATABASE_URL` configuration.

| Risk | Mitigation |
| --- | --- |
| Default production secret or password | Deployment checklist and encrypted environment variables; block release on defaults |
| Private tenant/rent data exposed publicly | Protected routes, public-envelope inspection, least-data shop schema |
| Mobile regression | Verify 390, 760, 1024, and 1440 CSS-pixel scenarios before release |
| JSON corruption or concurrent overwrite | Atomic local writes; PostgreSQL transaction and row lock; backup before destructive maintenance |
| SRS-to-code drift | Requirement IDs, route/API tests, status updates, change request, and baseline review |
| Stale rent status or due-date rules | Obtain official rent-cycle policy; keep transaction history and automatic overdue behavior as explicit future decisions |

Every change request must record requester, reason/evidence, affected requirement/business-rule/use-case IDs, privacy and data-model impact, API/UI impact, effort, risk, tests, MoSCoW decision, target release, approver, and closure evidence. Update this baseline, implementation, tests, risk record, and README together before declaring the change complete.

## 5. Validation-pending decisions

- Name and authority of the shopping-complex stakeholder who can approve operational/privacy requirements.
- Original questionnaire responses or fresh validated session notes.
- Approved physical floor plan and facility positions.
- Official rent cycle, due-date, automatic-overdue, payment-history, backup, recovery, retention, Bangla, and accessibility-conformance policies.
- Whether additional management or tenant roles are required after release 1.2.
