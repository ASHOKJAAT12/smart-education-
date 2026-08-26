# SmartLearn AI — Technical Specification
## Section 12: Development Phases

---

## Phase 1 — Foundation

**Goal**: Set up project scaffolding, dev tooling, and CI-ready structure.

**Dependencies**: None.

**Deliverables**:
- Monorepo structure: `/frontend`, `/backend`
- Backend: Express app with health check, `.env.example`, ESLint, Nodemon
- Frontend: Vite + React + Tailwind CSS configured
- MongoDB connection utility with retry logic
- Git repo initialized with `.gitignore` (node_modules, .env)
- README.md with setup instructions

**Acceptance Criteria**:
- `GET /api/health` returns `{ status: "ok" }`
- Frontend dev server starts on `localhost:5173`
- Backend dev server starts on `localhost:5000`
- MongoDB connection succeeds

---

## Phase 2 — Authentication

**Goal**: Full auth system — register, login, logout, JWT, password reset.

**Dependencies**: Phase 1.

**Deliverables**:
- User model (Mongoose)
- AuthService: register, login, refresh, logout, forgotPassword, resetPassword
- Auth routes + controllers
- JWT middleware (verifyToken, requireRole)
- Rate limiter on auth routes
- Email service (Brevo SMTP) — sends reset email
- Frontend pages: Login, Register, ForgotPassword, ResetPassword
- AuthContext + Axios interceptors for silent token refresh

**Acceptance Criteria**:
- Student can register, login, receive access token
- Refresh token silently renews session
- Password reset link received via email
- Invalid credentials return 401
- Expired reset token returns error

---

## Phase 3 — Core Education Data Layer

**Goal**: Full CRUD for Courses, Subjects, Topics, Resources, Questions.

**Dependencies**: Phase 2.

**Deliverables**:
- Mongoose models: Course, Subject, Topic, LearningResource, Question
- REST APIs with RBAC: Teacher/Admin CRUD; Student read-only
- Enrollment model + enroll endpoint
- File upload endpoint (Cloudinary integration)
- Teacher pages: ManageCourses, ManageSubjects, ManageTopics, UploadResources, QuestionEditor

**Acceptance Criteria**:
- Teacher can create course → subject → topic → resource chain
- Student can list courses, enroll, browse topics and resources
- Admin can delete any content

---

## Phase 4 — Student Onboarding & Dashboard

**Goal**: Student profile setup, course enrollment, learning goals, and a functional dashboard.

**Dependencies**: Phase 3.

**Deliverables**:
- Student profile page (edit name, avatar, bio)
- Course selection + enrollment UI
- Learning goals setup (target mastery, exam date, daily time)
- Enrollment model populated on enroll
- Student dashboard page (enrolled courses, recent activity placeholders)

**Acceptance Criteria**:
- Student completes onboarding in < 3 clicks
- Dashboard shows enrolled courses and empty states for progress

---

## Phase 5 — Diagnostic Assessment

**Goal**: First-time course assessment that seeds initial topic mastery scores.

**Dependencies**: Phase 3, Phase 4.

**Deliverables**:
- Assessment model, AssessmentResult model
- AssessmentService: generate diagnostic (sample questions per topic), score submission, mastery seeding
- Diagnostic assessment UI (timed, 1-question-per-screen)
- Results page (topic-by-topic breakdown)
- Progress model records created for each topic after diagnostic

**Acceptance Criteria**:
- On first enrollment, student is prompted for diagnostic
- Assessment covers all topics in the course
- On completion, Progress records exist per topic with accurate masteryScore
- Dashboard shows initial topic mastery after diagnostic

---

## Phase 6 — Recommendation Engine

**Goal**: Weak topic detection, next-topic recommendation, and basic study plan generation.

**Dependencies**: Phase 5.

**Deliverables**:
- RecommendationService (rule-based: Section 8 algorithm)
- Recommendation collection populated after each quiz/assessment
- Study plan generation (system-generated, non-AI)
- StudyPlan model + task completion endpoint
- Student: StudyPlan page, WeakTopics widget, Recommendation card

**Acceptance Criteria**:
- After assessment, weak topics correct identified based on mastery thresholds
- Student dashboard shows prioritized next-topic recommendation
- Study plan generated covers all weak + unstarted topics within target date
- Completing a task marks it done in study plan

---

## Phase 7 — AI Integration

**Goal**: AI tutor, explanation, quiz generation, and AI study plan.

**Dependencies**: Phase 2, Phase 6.

**Deliverables**:
- AIService + promptService + aiValidator
- AI endpoints: chat, explain, summarize, quiz-generate, study-plan
- SSE streaming for AI tutor chat
- Per-user daily quota enforcement
- AI tutor UI (chat interface per topic)
- AI explanation modal (accessible from topic page)
- AI study plan generation (replaces/augments system plan)

**Acceptance Criteria**:
- Student receives contextual AI tutor reply within 5 seconds
- AI-generated quiz has valid MCQ structure
- AI study plan populated with correct topic order and daily slots
- Rate limit returns 429 after quota exceeded
- AI failures never crash the UI

---

## Phase 8 — Learning & Quizzes

**Goal**: Full quiz creation, AI quiz generation, quiz taking, and mastery update loop.

**Dependencies**: Phase 6, Phase 7.

**Deliverables**:
- Quiz model, QuizAttempt model
- QuizService: create quiz, submit attempt, score, update mastery
- Mastery recalculation after each attempt (Section 8 formula)
- New recommendation generated after each quiz
- Teacher: QuizBuilder UI, manage quizzes
- Student: quiz-taking UI, results page, quiz history

**Acceptance Criteria**:
- Student completes quiz → score calculated → mastery updated → new recommendation returned
- Quiz history shows all past attempts with scores and dates
- Teacher can build quiz from existing questions + AI-generate new ones
- Passed quiz (≥ passing score) unlocks next topic in study plan

---

## Phase 9 — Teacher Dashboard

**Goal**: Teacher analytics and content management fully operational.

**Dependencies**: Phase 8.

**Deliverables**:
- TeacherAnalytics page: topic average mastery chart (Recharts), per-student mastery table
- Student detail view for teacher
- Quiz attempt distribution chart
- AI question generation with review/edit-before-save workflow
- Teacher sidebar finalized

**Acceptance Criteria**:
- Teacher can view all enrolled students and their mastery per topic
- Teacher can view quiz score distribution
- Teacher can generate 5 AI questions, edit them, and publish to topic

---

## Phase 10 — Admin Dashboard

**Goal**: Full admin control panel for users, content, analytics, and settings.

**Dependencies**: Phase 4.

**Deliverables**:
- Admin user management: list, create, deactivate, change role
- Platform analytics: total users, quizzes taken, active students
- Per-course enrollment stats
- System settings UI: mastery thresholds, AI quota
- Admin sidebar finalized

**Acceptance Criteria**:
- Admin can deactivate a user; that user cannot log in
- Settings changes persist and are applied to next API calls
- Analytics dashboard shows real data from MongoDB aggregations

---

## Phase 11 — UI Polish, Security Hardening & Performance

**Goal**: Production-ready quality, full responsive design, all edge cases handled.

**Dependencies**: Phases 1–10.

**Deliverables**:
- Mobile-responsive across all pages
- Skeleton loaders replacing all spinners on async content
- All empty states implemented
- Error boundaries at route level
- Loading/error/success toast system finalized
- Security: Helmet, CORS, full rate limiting verified
- File upload validation enforced
- All `.env.example` variables documented
- Lighthouse accessibility score ≥ 90

**Acceptance Criteria**:
- App renders correctly on 375px (mobile) viewport
- No console errors in production build
- Lighthouse performance ≥ 80 on student dashboard

---

## Phase 12 — Deployment & Hackathon Preparation

**Goal**: Deploy to public URL, final QA, demo preparation.

**Dependencies**: Phase 11.

**Deliverables**:
- Backend deployed (Railway / Render / Fly.io)
- Frontend deployed (Vercel / Netlify)
- MongoDB Atlas production cluster configured
- Cloudinary production bucket configured
- Brevo sender domain verified
- Demo seed data: 2 courses, 3 subjects, 10 topics, 50 questions, 2 quizzes
- Demo accounts: student@demo.com, teacher@demo.com, admin@demo.com
- Demo video walkthrough recorded
- README updated with live URL + setup instructions

**Acceptance Criteria**:
- Live URL accessible publicly
- Demo student completes full loop: enroll → diagnostic → recommendation → quiz → mastery updated
- All three role dashboards functional on live URL
