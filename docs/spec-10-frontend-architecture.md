# SmartLearn AI — Technical Specification
## Section 10: Frontend Architecture

---

## 10.1 Technology Stack

| Library | Purpose |
|---|---|
| React 18 | Component framework |
| Vite | Build tool, fast dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state, caching, background refetch |
| Axios | HTTP client with interceptors |
| Recharts | Charts for progress/analytics |
| React Hook Form | Form state + validation |
| Zod | Client-side schema validation |
| Lucide React | Icon library |

---

## 10.2 Project Folder Structure

```
/frontend/src
  /api            → Axios instance + service modules per domain
  /assets         → Static images, fonts
  /components
    /ui           → Generic: Button, Input, Modal, Card, Spinner, Badge
    /shared       → Navbar, Sidebar, Footer, PageHeader, EmptyState
    /student      → StudentSidebar, MasteryCard, TopicProgressBar ...
    /teacher      → TeacherSidebar, QuestionForm, QuizBuilder ...
    /admin        → AdminSidebar, UserTable, AnalyticsWidget ...
  /context        → AuthContext, ThemeContext
  /hooks          → useAuth, useProgress, useAI, useToast, usePagination
  /layouts        → AuthLayout, StudentLayout, TeacherLayout, AdminLayout
  /pages
    /auth         → Login, Register, ForgotPassword, ResetPassword
    /student      → Dashboard, StudyPlan, TopicPage, QuizPage,
                    QuizHistory, Progress, AITutor, Profile
    /teacher      → TeacherDashboard, ManageCourses, ManageQuizzes,
                    StudentAnalytics, QuestionEditor
    /admin        → AdminDashboard, ManageUsers, PlatformAnalytics, Settings
  /router         → AppRouter.jsx, ProtectedRoute.jsx, RoleRoute.jsx
  /utils          → formatDate, scoreColor, masteryLabel, axiosErrorHandler
  /constants      → API_ENDPOINTS, ROLES, MASTERY_LEVELS
```

---

## 10.3 Route Structure

### Public Routes
```
/login
/register
/forgot-password
/reset-password/:token
```

### Student Routes (Protected: role = student)
```
/student/dashboard
/student/profile
/student/courses
/student/courses/:courseId
/student/courses/:courseId/topics/:topicId
/student/courses/:courseId/quiz/:quizId
/student/quiz-history
/student/progress
/student/study-plan/:courseId
/student/ai-tutor/:topicId
```

### Teacher Routes (Protected: role = teacher)
```
/teacher/dashboard
/teacher/courses
/teacher/courses/:courseId/subjects
/teacher/subjects/:subjectId/topics
/teacher/topics/:topicId/resources
/teacher/topics/:topicId/questions
/teacher/quizzes
/teacher/analytics/:courseId
```

### Admin Routes (Protected: role = admin)
```
/admin/dashboard
/admin/users
/admin/courses
/admin/analytics
/admin/settings
```

---

## 10.4 Layouts

| Layout | Used By | Includes |
|---|---|---|
| `AuthLayout` | Login, Register, Reset | Centered card, no nav |
| `StudentLayout` | All student pages | Left sidebar, top navbar, main content |
| `TeacherLayout` | All teacher pages | Left sidebar, top navbar |
| `AdminLayout` | All admin pages | Left sidebar, stats row |

---

## 10.5 Protected Route Strategy

```jsx
// ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// RoleRoute.jsx
const RoleRoute = ({ roles, children }) => {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};
```

---

## 10.6 State Management

| State Type | Tool |
|---|---|
| Auth user / token | React Context (`AuthContext`) |
| Server data | TanStack Query (with staleTime, retry) |
| Forms | React Hook Form + Zod |
| UI state (modals, toasts) | Local component state |
| Theme | React Context (`ThemeContext`) |

No Redux. Context is sufficient for auth. TanStack Query handles all API caching.

---

## 10.7 API Service Layer

```js
// /api/axiosInstance.js
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Request interceptor → attach access token from memory
api.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Response interceptor → silent refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const newToken = await refreshAccessToken(); // POST /auth/refresh-token
      err.config.headers.Authorization = `Bearer ${newToken}`;
      return api(err.config);
    }
    return Promise.reject(err);
  }
);
```

Domain services:
```
/api/authService.js      → login, register, logout, refreshToken
/api/studentService.js   → dashboard, progress, studyPlan, recommendations
/api/courseService.js    → getCourses, getCourse, enroll
/api/quizService.js      → getQuiz, submitAttempt, getHistory
/api/aiService.js        → sendMessage, explainTopic, generateQuiz
/api/teacherService.js   → manageCourses, manageQuestions, getAnalytics
/api/adminService.js     → manageUsers, getPlatformStats
```

---

## 10.8 Error / Loading / Empty States

- **Loading**: Skeleton components per section (not spinner-only).
- **Error**: `ErrorBoundary` at route level; individual query errors show toast + retry button.
- **Empty**: `EmptyState` component with icon + message + CTA (e.g., "No quizzes yet. Take one?").
- **AI Loading**: Typing indicator animation while streaming.
