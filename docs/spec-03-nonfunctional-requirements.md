# SmartLearn AI — Technical Specification
## Section 3: Non-Functional Requirements

---

## 3.1 Security

- NFR-SEC-01: All passwords stored as bcrypt hashes (cost factor ≥ 12). Never stored in plain text.
- NFR-SEC-02: JWT access tokens expire in 15 minutes; refresh tokens expire in 7 days stored in httpOnly cookies.
- NFR-SEC-03: All API routes require authentication except public endpoints (login, register, forgot-password).
- NFR-SEC-04: Role-based access control (RBAC) enforced on every protected route.
- NFR-SEC-05: All inputs validated and sanitized server-side (express-validator / zod).
- NFR-SEC-06: Helmet.js applied for HTTP security headers.
- NFR-SEC-07: CORS restricted to listed frontend origins only.
- NFR-SEC-08: Rate limiting on auth endpoints (max 10 req/15 min per IP).
- NFR-SEC-09: File uploads validated (type, size ≤ 10 MB) before Cloudinary upload.
- NFR-SEC-10: AI API keys stored only in backend environment variables; never sent to frontend.
- NFR-SEC-11: MongoDB injection prevented via Mongoose schema validation.
- NFR-SEC-12: Sensitive query params never logged in production.

---

## 3.2 Performance

- NFR-PERF-01: API P95 response time < 300 ms for standard CRUD operations.
- NFR-PERF-02: API P95 response time < 5 s for AI-assisted endpoints (streaming preferred for UX).
- NFR-PERF-03: MongoDB queries on hot paths must use indexed fields.
- NFR-PERF-04: Pagination required on all list endpoints (default page size: 20).
- NFR-PERF-05: Static assets served via CDN (Cloudinary for media).
- NFR-PERF-06: Frontend JS bundle split by route (React lazy + Suspense).

---

## 3.3 Scalability

- NFR-SCALE-01: Stateless API (JWT-based) allows horizontal scaling.
- NFR-SCALE-02: MongoDB Atlas supports vertical and horizontal scaling.
- NFR-SCALE-03: AI service is isolated in its own service module; can be independently rate-limited or swapped.
- NFR-SCALE-04: Email service (Brevo) decoupled from request lifecycle (fire-and-forget / queue-ready).
- NFR-SCALE-05: Recommendation engine is its own service layer — replaceable with ML model without API changes.

---

## 3.4 Reliability

- NFR-REL-01: Graceful error handling — no unhandled promise rejections in production.
- NFR-REL-02: All AI calls have fallback error messages; failures do not crash the main learning flow.
- NFR-REL-03: Database connection uses Mongoose connection pooling with retry logic.
- NFR-REL-04: Environment-driven configuration — no hard-coded values.

---

## 3.5 Maintainability

- NFR-MAINT-01: Backend follows MVC + service layer pattern. Controllers are thin; logic lives in services.
- NFR-MAINT-02: Frontend follows feature-based folder structure.
- NFR-MAINT-03: Shared utilities (validators, formatters, constants) extracted to `/utils`.
- NFR-MAINT-04: Every service has a single responsibility; no cross-domain coupling.
- NFR-MAINT-05: All environment variables documented in `.env.example`.
- NFR-MAINT-06: Consistent naming conventions enforced (camelCase JS, PascalCase components, UPPER_SNAKE env vars).

---

## 3.6 Accessibility

- NFR-A11Y-01: WCAG 2.1 AA compliance targeted.
- NFR-A11Y-02: All interactive elements keyboard accessible.
- NFR-A11Y-03: Color contrast ratio ≥ 4.5:1 for normal text.
- NFR-A11Y-04: ARIA labels on icon-only buttons.
- NFR-A11Y-05: Focus management on modal open/close.

---

## 3.7 Responsive Design

- NFR-RESP-01: Mobile-first design; breakpoints at 640px (sm), 768px (md), 1024px (lg), 1280px (xl).
- NFR-RESP-02: Navigation collapses to hamburger menu on mobile.
- NFR-RESP-03: All tables/charts scroll horizontally on narrow viewports.
- NFR-RESP-04: Touch targets ≥ 44×44 px on mobile.
