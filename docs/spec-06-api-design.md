# SmartLearn AI — Technical Specification
## Section 6: API Design

Base URL: `https://api.smartlearnai.com/api`  
All protected routes require: `Authorization: Bearer <access_token>`

---

## 6.1 Auth Routes — `/api/auth`

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/register` | Public | `{name, email, password}` | `{user, accessToken}` |
| POST | `/login` | Public | `{email, password}` | `{user, accessToken}` |
| POST | `/logout` | JWT | — | `{message}` |
| POST | `/refresh-token` | Cookie | — | `{accessToken}` |
| POST | `/forgot-password` | Public | `{email}` | `{message}` |
| POST | `/reset-password/:token` | Public | `{password}` | `{message}` |
| GET | `/me` | JWT | — | `{user}` |
| PATCH | `/change-password` | JWT | `{oldPassword, newPassword}` | `{message}` |

**Validation rules:**
- `email`: valid format, lowercase
- `password`: min 8 chars, 1 uppercase, 1 number
- Reset token: validated + expiry checked server-side

**Error codes:**
- `400` Invalid input
- `401` Invalid credentials / expired token
- `404` Email not found
- `429` Rate limit exceeded

---

## 6.2 User Routes — `/api/users`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/profile` | JWT | Any | Get own profile |
| PATCH | `/profile` | JWT | Any | Update name, bio, avatar |
| POST | `/avatar` | JWT | Any | Upload avatar to Cloudinary |

---

## 6.3 Student Routes — `/api/student`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | JWT/Student | Mastery overview, recommendations, upcoming tasks |
| GET | `/progress` | JWT/Student | All topic progress records |
| GET | `/progress/:topicId` | JWT/Student | Single topic progress |
| GET | `/recommendations` | JWT/Student | Current recommendation list |
| GET | `/study-plan/:courseId` | JWT/Student | Active study plan |
| POST | `/study-plan/generate` | JWT/Student | `{courseId, dailyMinutes, targetDate}` → AI-generated plan |
| PATCH | `/study-plan/task/:taskId` | JWT/Student | Mark task complete |
| GET | `/weak-topics/:courseId` | JWT/Student | List of weak topics |

---

## 6.4 Course Routes — `/api/courses`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Any | List all published courses |
| GET | `/:id` | JWT | Any | Course details |
| POST | `/` | JWT | Teacher/Admin | Create course |
| PATCH | `/:id` | JWT | Teacher/Admin | Update course |
| DELETE | `/:id` | JWT | Admin | Delete course |
| POST | `/:id/enroll` | JWT | Student | Enroll student in course |
| GET | `/:id/subjects` | JWT | Any | Course subjects |
| GET | `/:id/students` | JWT | Teacher/Admin | Enrolled students |

---

## 6.5 Subject Routes — `/api/subjects`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Any | `?courseId=` filter |
| POST | `/` | JWT | Teacher/Admin | Create subject |
| PATCH | `/:id` | JWT | Teacher/Admin | Update subject |
| DELETE | `/:id` | JWT | Admin | Delete subject |

---

## 6.6 Topic Routes — `/api/topics`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Any | `?subjectId=` filter |
| GET | `/:id` | JWT | Any | Topic detail |
| POST | `/` | JWT | Teacher/Admin | Create topic |
| PATCH | `/:id` | JWT | Teacher/Admin | Update topic |
| DELETE | `/:id` | JWT | Admin | Delete topic |

---

## 6.7 Resource Routes — `/api/resources`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Any | `?topicId=` query |
| POST | `/` | JWT | Teacher/Admin | Upload resource |
| PATCH | `/:id` | JWT | Teacher/Admin | Edit resource metadata |
| DELETE | `/:id` | JWT | Teacher/Admin | Delete resource |
| POST | `/:id/complete` | JWT | Student | Mark resource complete |

---

## 6.8 Question Routes — `/api/questions`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Teacher/Admin | `?topicId=` filter |
| POST | `/` | JWT | Teacher/Admin | Create question |
| PATCH | `/:id` | JWT | Teacher/Admin | Update question |
| DELETE | `/:id` | JWT | Teacher/Admin | Delete question |
| POST | `/ai-generate` | JWT | Teacher | `{topicId, count, difficulty}` → AI generates questions |

---

## 6.9 Quiz Routes — `/api/quizzes`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Any | `?topicId=` or `?courseId=` |
| GET | `/:id` | JWT | Any | Quiz detail with questions |
| POST | `/` | JWT | Teacher/Admin | Create quiz |
| PATCH | `/:id` | JWT | Teacher/Admin | Update quiz |
| DELETE | `/:id` | JWT | Teacher/Admin | Delete quiz |
| POST | `/:id/attempt` | JWT | Student | Submit quiz attempt |
| GET | `/history` | JWT | Student | Student's quiz history |
| GET | `/:id/results` | JWT | Teacher/Admin | All attempts for a quiz |
| POST | `/ai-generate` | JWT | Student | `{topicId}` → AI quiz on demand |

### Quiz Attempt Request Body
```json
{
  "answers": [
    { "question": "<questionId>", "selectedOption": "B", "timeTakenSeconds": 45 }
  ]
}
```
### Quiz Attempt Response
```json
{
  "score": 75,
  "passed": true,
  "breakdown": [...],
  "updatedMastery": { "level": "good", "score": 72 },
  "nextRecommendation": { "topicId": "...", "reason": "next" }
}
```

---

## 6.10 Assessment Routes — `/api/assessments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/diagnostic` | JWT/Student | Start diagnostic `{courseId}` |
| GET | `/:id` | JWT/Student | Get assessment questions |
| POST | `/:id/submit` | JWT/Student | Submit answers |
| GET | `/results/:courseId` | JWT/Student | Latest assessment result |

---

## 6.11 AI Routes — `/api/ai`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/chat` | JWT | `{topicId, message, conversationId?}` | AI tutor message |
| POST | `/explain` | JWT | `{topicId, concept}` | AI explanation |
| POST | `/summarize` | JWT | `{topicId}` | AI summary |
| POST | `/quiz-generate` | JWT | `{topicId, count, difficulty}` | AI quiz generation |
| POST | `/study-plan` | JWT | `{courseId, dailyMinutes, targetDate, weakTopics[]}` | AI study plan |
| GET | `/conversations` | JWT | — | List user's AI conversations |
| GET | `/conversations/:id` | JWT | — | Get conversation messages |

---

## 6.12 Teacher Routes — `/api/teacher`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/analytics/course/:courseId` | JWT/Teacher | Topic-level average mastery |
| GET | `/analytics/student/:studentId` | JWT/Teacher | Per-student topic mastery |
| GET | `/students/:courseId` | JWT/Teacher | Enrolled students list |

---

## 6.13 Admin Routes — `/api/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users` | JWT/Admin | List all users with filters |
| POST | `/users` | JWT/Admin | Create user |
| PATCH | `/users/:id` | JWT/Admin | Update role, isActive |
| DELETE | `/users/:id` | JWT/Admin | Deactivate user |
| GET | `/analytics/platform` | JWT/Admin | Platform-wide stats |
| GET | `/analytics/courses` | JWT/Admin | Per-course metrics |
| PATCH | `/settings` | JWT/Admin | Update mastery thresholds, AI quotas |
| GET | `/settings` | JWT/Admin | Get current settings |
