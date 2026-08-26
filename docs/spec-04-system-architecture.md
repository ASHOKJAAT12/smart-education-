# SmartLearn AI — Technical Specification
## Section 4: System Architecture

---

## 4.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / MOBILE                         │
│                  React SPA (Vite + Tailwind CSS)                │
│         Student UI │ Teacher UI │ Admin UI                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST + JSON
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS API SERVER                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Auth    │ │ Student  │ │ Teacher  │ │     Admin         │  │
│  │ Service  │ │ Service  │ │ Service  │ │     Service       │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │Assessment│ │Recommend │ │   AI     │ │   Analytics       │  │
│  │ Service  │ │ Service  │ │ Service  │ │   Service         │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐                                      │
│  │  Email   │ │  File    │                                      │
│  │ Service  │ │ Service  │                                      │
│  └──────────┘ └──────────┘                                      │
└───────┬───────────┬────────────────┬──────────────┬────────────┘
        │           │                │              │
        ▼           ▼                ▼              ▼
  ┌──────────┐ ┌──────────┐  ┌──────────┐  ┌──────────────┐
  │ MongoDB  │ │ LLM API  │  │Cloudinary│  │   Brevo      │
  │  Atlas   │ │(OpenAI / │  │ (Media)  │  │  (Email)     │
  │          │ │ Gemini)  │  │          │  │              │
  └──────────┘ └──────────┘  └──────────┘  └──────────────┘
```

---

## 4.2 Layer Descriptions

### Frontend (React SPA)
- Built with React + Vite + Tailwind CSS.
- Three layout zones: Student, Teacher, Admin.
- Communicates with backend via Axios through an API service layer.
- Protected routes enforce authentication and role checks client-side (server remains authoritative).
- State: React Context for auth/user; React Query (TanStack Query) for server state.

### Express.js API Server
Single Node.js/Express application organized as:
```
/src
  /routes        → HTTP routing (thin, delegates to controllers)
  /controllers   → Request/response handling
  /services      → Business logic, AI calls, recommendations
  /models        → Mongoose schemas
  /middleware    → Auth, RBAC, rate limiting, validation, error handling
  /utils         → Shared helpers
  /config        → DB connection, Cloudinary, Brevo, AI client setup
```

### Service Layer Responsibilities

| Service | Responsibility |
|---|---|
| **AuthService** | Register, login, JWT issue/verify, password reset |
| **StudentService** | Profile, enrollment, study time, goals |
| **AssessmentService** | Diagnostic + quiz scoring, mastery update |
| **RecommendationService** | Weak topic detection, next-topic logic, study plan |
| **AIService** | Prompt construction, LLM call, response validation |
| **TeacherService** | Course/subject/topic/resource/question/quiz CRUD |
| **AdminService** | User management, platform analytics |
| **AnalyticsService** | Aggregation queries for dashboards |
| **EmailService** | Brevo SMTP transactional email send |
| **FileService** | Cloudinary upload/delete |

---

## 4.3 Data Flow Examples

### Student Takes a Quiz
```
Frontend → POST /api/quizzes/:id/attempt
→ QuizController → AssessmentService.scoreAttempt()
→ Save QuizAttempt to MongoDB
→ AssessmentService.updateMastery(studentId, topicId, score)
→ RecommendationService.recalculate(studentId)
→ Return: { score, breakdown, updatedMastery, nextRecommendation }
```

### AI Tutor Message
```
Frontend → POST /api/ai/chat
→ AIController → AIService.buildPrompt(context, message)
→ LLM API call (backend only)
→ AIService.validateResponse(raw)
→ Save AIConversation to MongoDB
→ Return: { reply, topicContext }
```

### Password Reset
```
Frontend → POST /api/auth/forgot-password { email }
→ AuthController → AuthService.generateResetToken()
→ Save hashed token + expiry on User document
→ EmailService.sendResetEmail(email, token)
→ Return: 200 OK (always, to prevent enumeration)
```

---

## 4.4 Communication Protocol

- **Frontend ↔ Backend**: HTTPS REST/JSON.
- **Backend ↔ MongoDB**: Mongoose ODM.
- **Backend ↔ LLM API**: HTTPS SDK (OpenAI / Gemini / Anthropic — pluggable via env var `AI_PROVIDER`).
- **Backend ↔ Cloudinary**: Node Cloudinary SDK.
- **Backend ↔ Brevo**: Nodemailer via SMTP credentials.
- **AI streaming**: SSE (Server-Sent Events) used for AI tutor chat response streaming to improve UX.
