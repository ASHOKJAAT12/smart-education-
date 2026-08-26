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

// ─── Guards ───────────────────────────────────────────────────────────────────

/**
 * ProtectedRoute — blocks unauthenticated access.
 * Saves the intended location so the user is redirected back after login.
 *
 * @param {string[]} roles - Optional list of roles allowed. Empty = any authenticated user.
 */
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

            {/* ── Student (Phase 3) ───────────────────────────── */}
            <Route
                path="/student/*"
                element={
                    <ProtectedRoute roles={['student']}>
                        <PlaceholderDashboard role="student" />
                    </ProtectedRoute>
                }
            />

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
