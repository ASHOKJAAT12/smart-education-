import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

// Layouts
import BaseLayout from '../layouts/BaseLayout';

// Public pages
import HomePage from '../pages/HomePage';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Phase 3 — Education pages
import CoursesPage from '../pages/courses/CoursesPage';
import CourseDetailPage from '../pages/courses/CourseDetailPage';
import SubjectDetailPage from '../pages/subjects/SubjectDetailPage';
import TopicDetailPage from '../pages/topics/TopicDetailPage';
import QuizListPage from '../pages/quizzes/QuizListPage';
import ManageCoursesPage from '../pages/manage/ManageCoursesPage';

// Phase 4 — Student
import StudentLayout from '../layouts/StudentLayout';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import OnboardingPage from '../pages/student/OnboardingPage';
import AssessmentIntro from '../pages/student/AssessmentIntro';
import AssessmentTake from '../pages/student/AssessmentTake';
import AssessmentResult from '../pages/student/AssessmentResult';
import AssessmentHistory from '../pages/student/AssessmentHistory';
import RecommendationsPage from '../pages/student/RecommendationsPage';
import StudyPlan from '../pages/student/StudyPlan';
import AITutor from '../pages/student/AITutor';
import AIQuizGenerator from '../pages/student/AIQuizGenerator';
// Phase 8 - Adaptive Engine
import TopicLearningPage from '../pages/student/TopicLearningPage';
import PracticeMode from '../pages/student/PracticeMode';
import FormalQuiz from '../pages/student/FormalQuiz';
import QuizResult from '../pages/student/QuizResult';
import StudentProgress from '../pages/student/StudentProgress';
import QuizHistory from '../pages/student/QuizHistory';
// ─── Guards ───────────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

/**
 * OnboardingGuard — redirects students who have not completed onboarding.
 * Allows access to /student/onboarding itself so they can complete it.
 */
const OnboardingGuard = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (user?.role === 'student' && !user.onboardingCompleted && location.pathname !== '/student/onboarding') {
        return <Navigate to="/student/onboarding" replace />;
    }

    return children;
};

/**
 * GuestRoute — redirects authenticated users away from auth pages.
 * Prevents logged-in users from seeing /login or /register.
 */
const GuestRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (user) {
        const roleRedirects = {
            student: '/student/dashboard',
            teacher: '/teacher/dashboard',
            admin: '/admin/dashboard',
        };
        return <Navigate to={roleRedirects[user.role] || '/'} replace />;
    }

    return children;
};

// ─── Placeholder dashboard pages ─────────────────────────────────────────────
// These will be replaced in Phase 3 (Student), Phase 5 (Teacher), Phase 6 (Admin)

const PlaceholderDashboard = ({ role }) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f0f1a] text-slate-300">
        <h1 className="text-2xl font-bold text-indigo-400 capitalize">{role} Dashboard</h1>
        <p className="text-slate-500">Coming in Phase {role === 'student' ? 3 : role === 'teacher' ? 5 : 6}</p>
        <button
            onClick={() => {
                const { logout } = window.__smartlearn_auth_ctx__ || {};
                // Fallback: just navigate home
                window.location.href = '/';
            }}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:border-indigo-500 hover:text-white"
        >
            Go Home
        </button>
    </div>
);

// ─── Router ───────────────────────────────────────────────────────────────────

const AppRouter = () => {
    return (
        <Routes>
            {/* ── Public ──────────────────────────────────────── */}
            <Route
                path="/"
                element={
                    <BaseLayout>
                        <HomePage />
                    </BaseLayout>
                }
            />

            {/* ── Auth (guest-only) ────────────────────────────── */}
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <LoginPage />
                    </GuestRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <GuestRoute>
                        <RegisterPage />
                    </GuestRoute>
                }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* ── Education (Public / semi-public) ────────────── */}
            <Route path="/courses" element={<BaseLayout><CoursesPage /></BaseLayout>} />
            <Route path="/courses/:id" element={<BaseLayout><CourseDetailPage /></BaseLayout>} />
            <Route path="/subjects/:id" element={<BaseLayout><SubjectDetailPage /></BaseLayout>} />
            <Route path="/topics/:id" element={<BaseLayout><TopicDetailPage /></BaseLayout>} />

            {/* ── Quizzes (authenticated) ──────────────────────── */}
            <Route
                path="/quizzes"
                element={
                    <ProtectedRoute>
                        <BaseLayout><QuizListPage /></BaseLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/quizzes/:id"
                element={
                    <ProtectedRoute>
                        <BaseLayout><QuizListPage /></BaseLayout>
                    </ProtectedRoute>
                }
            />

            {/* ── Content Management (teacher + admin) ────────── */}
            <Route
                path="/manage/courses"
                element={
                    <ProtectedRoute roles={['teacher', 'admin']}>
                        <ManageCoursesPage />
                    </ProtectedRoute>
                }
            />

            {/* ── Student (Phase 4) ───────────────────────────── */}

            {/* Onboarding — accessible before onboarding is complete */}
            <Route
                path="/student/onboarding"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingPage />
                    </ProtectedRoute>
                }
            />

            {/* All other student routes require onboarding */}
            <Route
                path="/student/dashboard"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><StudentDashboard /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/profile"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><StudentProfilePage /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/subjects"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><CoursesPage /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/subjects/:id"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><SubjectDetailPage /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/topics/:id"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><TopicDetailPage /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            {/* Assessment routes */}
            <Route
                path="/student/assessment/intro/:assessmentId"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><AssessmentIntro /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/assessment/take/:attemptId"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            {/* Do not include the main layout sidebar while taking the test for full screen focus */}
                            <AssessmentTake />
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/assessment/result/:attemptId"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><AssessmentResult /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/assessment/history"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><AssessmentHistory /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            {/* Phase 6 Recommendation Routes */}
            <Route
                path="/student/recommendations"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><RecommendationsPage /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/study-plan"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><StudyPlan /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            {/* Phase 7 AI AI Routes */}
            <Route
                path="/student/ai-tutor"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><AITutor /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/ai-tutor/:conversationId"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><AITutor /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/generate-quiz"
                element={
                    <ProtectedRoute roles={['student']}>
                        <OnboardingGuard>
                            <StudentLayout><AIQuizGenerator /></StudentLayout>
                        </OnboardingGuard>
                    </ProtectedRoute>
                }
            />

            {/* Phase 8 Adaptive Pipeline Routes */}
            <Route path="/student/topics/:topicId/learn" element={<ProtectedRoute roles={['student']}><OnboardingGuard><StudentLayout><TopicLearningPage /></StudentLayout></OnboardingGuard></ProtectedRoute>} />
            <Route path="/student/topics/:topicId/practice" element={<ProtectedRoute roles={['student']}><OnboardingGuard><StudentLayout><PracticeMode /></StudentLayout></OnboardingGuard></ProtectedRoute>} />
            <Route path="/student/quizzes/:quizId" element={<ProtectedRoute roles={['student']}><OnboardingGuard><FormalQuiz /></OnboardingGuard></ProtectedRoute>} />
            <Route path="/student/quizzes/:quizId/result/:attemptId" element={<ProtectedRoute roles={['student']}><OnboardingGuard><StudentLayout><QuizResult /></StudentLayout></OnboardingGuard></ProtectedRoute>} />
            <Route path="/student/progress" element={<ProtectedRoute roles={['student']}><OnboardingGuard><StudentLayout><StudentProgress /></StudentLayout></OnboardingGuard></ProtectedRoute>} />
            <Route path="/student/quiz-history" element={<ProtectedRoute roles={['student']}><OnboardingGuard><StudentLayout><QuizHistory /></StudentLayout></OnboardingGuard></ProtectedRoute>} />

            {/* Catch-all for /student/* — redirect to dashboard */}
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

            {/* ── Teacher (Phase 5) ───────────────────────────── */}
            <Route
                path="/teacher/*"
                element={
                    <ProtectedRoute roles={['teacher', 'admin']}>
                        <PlaceholderDashboard role="teacher" />
                    </ProtectedRoute>
                }
            />

            {/* ── Admin (Phase 6) ─────────────────────────────── */}
            <Route
                path="/admin/*"
                element={
                    <ProtectedRoute roles={['admin']}>
                        <PlaceholderDashboard role="admin" />
                    </ProtectedRoute>
                }
            />

            {/* ── Error pages ─────────────────────────────────── */}
            <Route
                path="/unauthorized"
                element={
                    <BaseLayout>
                        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                            <p className="text-2xl font-bold text-red-400">403 — Unauthorized</p>
                            <p className="text-slate-400">You don't have permission to view this page.</p>
                            <a href="/" className="text-indigo-400 underline hover:text-indigo-300">Go home</a>
                        </div>
                    </BaseLayout>
                }
            />
            <Route
                path="*"
                element={
                    <BaseLayout>
                        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                            <p className="text-2xl font-bold text-slate-300">404 — Page Not Found</p>
                            <a href="/" className="text-indigo-400 underline hover:text-indigo-300">Go home</a>
                        </div>
                    </BaseLayout>
                }
            />
        </Routes>
    );
};

export default AppRouter;
