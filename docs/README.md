# SmartLearn AI — Phase 0: Technical Specification Index

> **Status**: ✅ Complete  
> **Date**: 2026-08-25  
> **Purpose**: Production-ready technical specification for the SmartLearn AI platform.  
> **Stack**: React + Tailwind · Node.js/Express · MongoDB · JWT · Cloudinary · Brevo · LLM API

---

## Documents

| # | Document | Contents |
|---|---|---|
| 1 | [spec-01-product-overview.md](./spec-01-product-overview.md) | Problem, audience, solution, innovation, value proposition |
| 2 | [spec-02-functional-requirements.md](./spec-02-functional-requirements.md) | Student, Teacher, Admin feature requirements |
| 3 | [spec-03-nonfunctional-requirements.md](./spec-03-nonfunctional-requirements.md) | Security, performance, scalability, accessibility, responsive |
| 4 | [spec-04-system-architecture.md](./spec-04-system-architecture.md) | Architecture diagram, service layer, data flows |
| 5 | [spec-05-database-design.md](./spec-05-database-design.md) | All 16 MongoDB collections with fields, types, indexes |
| 6 | [spec-06-api-design.md](./spec-06-api-design.md) | All REST endpoints with methods, auth, roles, bodies, responses |
| 7 | [spec-07-auth-architecture.md](./spec-07-auth-architecture.md) | JWT dual-token, RBAC, password reset, security headers |
| 8 | [spec-08-learning-algorithm.md](./spec-08-learning-algorithm.md) | Mastery scoring, weak topic detection, recommendation engine |
| 9 | [spec-09-ai-architecture.md](./spec-09-ai-architecture.md) | AI service layer, prompt design, rate limiting, error handling |
| 10 | [spec-10-frontend-architecture.md](./spec-10-frontend-architecture.md) | Folder structure, routes, layouts, state, API service layer |
| 11 | [spec-11-security-plan.md](./spec-11-security-plan.md) | Full security plan across all layers |
| 12 | [spec-12-development-phases.md](./spec-12-development-phases.md) | 12 development phases with goals, deliverables, acceptance criteria |

---

## Recommended Architecture Summary

```
Frontend:   React 18 + Vite + Tailwind CSS + TanStack Query + React Hook Form
Backend:    Node.js + Express.js (MVC + Service Layer)
Database:   MongoDB Atlas + Mongoose ODM
Auth:       JWT (dual-token: access 15m + refresh 7d httpOnly cookie) + bcryptjs
AI:         Pluggable LLM (OpenAI/Gemini) — backend-only, prompt service pattern
Files:      Cloudinary SDK (images, PDFs)
Email:      Brevo SMTP via Nodemailer
Security:   Helmet + CORS + express-rate-limit + express-validator
```

---

## Core Learning Loop

```
ENROLL → DIAGNOSTIC ASSESSMENT → MASTERY SEEDED
      → WEAK TOPICS DETECTED → STUDY PLAN GENERATED
      → LEARN (resources + AI tutor) → PRACTICE (quiz)
      → MASTERY UPDATED → RECOMMENDATION → NEXT TOPIC
      → REPEAT
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Dual-token JWT (no session) | Stateless API for scalability; httpOnly cookie prevents XSS |
| TanStack Query over Redux | Server state fits React Query perfectly; no boilerplate |
| Rule-based mastery algorithm | Deterministic, testable, auditable — upgradeable to ML later |
| Backend-only AI calls | Prevents API key exposure; allows rate limiting, caching, validation |
| Service layer pattern | Controllers stay thin; logic is testable and replaceable |
| MongoDB (document model) | Flexible schema fits adaptive learning data (nested tasks, messages) |
| Pluggable AI provider | `AI_PROVIDER` env var lets you switch OpenAI → Gemini without code change |

---

## Phase Priority for Hackathon

For a hackathon demo, complete phases in this order:  
**Phase 1 → 2 → 3 → 5 → 6 → 7 → 8** (core student loop first)  
Then: **Phase 4 → 9 → 10 → 11 → 12**
