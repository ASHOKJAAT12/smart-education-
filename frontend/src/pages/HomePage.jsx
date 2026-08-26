import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../services/healthService';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import {
    Brain,
    BookOpen,
    BarChart3,
    Zap,
    Users,
    CheckCircle,
    Activity,
    Database,
} from 'lucide-react';

// ─── Feature cards ───────────────────────────────────────────────────────────
const features = [
    {
        icon: <Brain className="h-6 w-6" />,
        title: 'AI-Powered Tutoring',
        desc: 'Ask questions, get instant explanations, and learn at your pace with an intelligent AI tutor.',
    },
    {
        icon: <BarChart3 className="h-6 w-6" />,
        title: 'Mastery Tracking',
        desc: 'Know exactly where you stand on every topic with real-time mastery scores.',
    },
    {
        icon: <Zap className="h-6 w-6" />,
        title: 'Smart Recommendations',
        desc: 'A recommendation engine detects weak spots and tells you what to study next.',
    },
    {
        icon: <BookOpen className="h-6 w-6" />,
        title: 'Personalized Study Plans',
        desc: 'AI-generated daily study plans tailored to your goals and available time.',
    },
    {
        icon: <Users className="h-6 w-6" />,
        title: 'Teacher & Admin Tools',
        desc: 'Create quizzes, manage content, and monitor every student progress.',
  },
    {
        icon: <CheckCircle className="h-6 w-6" />,
        title: 'Adaptive Quizzes',
        desc: 'Practice with AI-generated or teacher-created quizzes that update your mastery.',
    },
];

// ─── System Status Card ───────────────────────────────────────────────────────
const SystemStatus = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['health'],
        queryFn: checkHealth,
        retry: 2,
        staleTime: 30_000,
    });

    const health = data?.data;

    return (
        <div className="mx-auto mt-6 w-full max-w-sm rounded-2xl border border-primary-800/40 bg-[#161629] p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <Activity className="h-4 w-4 text-primary-400" />
                    System Status
                </span>
                {!isLoading && (
                    <button
                        onClick={() => refetch()}
                        className="text-xs text-slate-500 transition hover:text-primary-300"
                    >
                        Refresh
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Spinner size="sm" />
                    Checking API...
                </div>
            )}

            {isError && (
                <ErrorMessage
                    message="Cannot reach the API server. Is the backend running?"
                    onRetry={refetch}
                />
            )}

            {health && (
                <ul className="space-y-2 text-sm">
                    <StatusRow
                        icon={<Activity className="h-3.5 w-3.5" />}
                        label="API"
                        value={health.status === 'ok' ? 'Online' : 'Degraded'}
                        ok={health.status === 'ok'}
                    />
                    <StatusRow
                        icon={<Database className="h-3.5 w-3.5" />}
                        label="Database"
                        value={health.database.status}
                        ok={health.database.connected}
                    />
                    <StatusRow
                        icon={<Zap className="h-3.5 w-3.5" />}
                        label="Environment"
                        value={health.environment}
                        ok
                    />
                    <StatusRow
                        icon={<CheckCircle className="h-3.5 w-3.5" />}
                        label="Uptime"
                        value={`${health.uptime}s`}
                        ok
                    />
                </ul>
            )}
        </div>
    );
};

const StatusRow = ({ icon, label, value, ok }) => (
    <li className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-slate-400">
            {icon}
            {label}
        </span>
        <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ok
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {value}
        </span>
    </li>
);

// ─── Home Page ────────────────────────────────────────────────────────────────
const HomePage = () => {
    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden px-4 pb-24 pt-20 text-center sm:px-6 lg:px-8">
                {/* Gradient glow */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
                >
                    <div className="h-[500px] w-[800px] rounded-full bg-primary-600/10 blur-[120px]" />
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-primary-700/50 bg-primary-900/30 px-4 py-1.5 text-xs font-medium text-primary-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" />
                    AI-Powered Personalized Education
                </div>

                <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                    Stop Studying Everything.
                    <br />
                    <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                        Start Studying What Matters.
                    </span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
                    SmartLearn AI continuously assesses your knowledge, identifies weak topics, and adapts
                    your learning path — so every minute you study counts.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <a
                        href="/register"
                        className="w-full rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/30 transition hover:bg-primary-500 sm:w-auto"
                    >
                        Start Learning Free
                    </a>
                    <a
                        href="#features"
                        className="w-full rounded-xl border border-primary-700/50 px-8 py-3.5 text-sm font-medium text-slate-300 transition hover:border-primary-500 hover:text-white sm:w-auto"
                    >
                        See Features
                    </a>
                </div>

                {/* System status widget */}
                <SystemStatus />
            </section>

            {/* Features */}
            <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <h2 className="mb-3 text-center text-3xl font-bold text-white">
                        Everything you need to learn smarter
                    </h2>
                    <p className="mx-auto mb-12 max-w-xl text-center text-slate-400">
                        A full adaptive learning platform for students, teachers, and administrators.
                    </p>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="group rounded-2xl border border-primary-800/30 bg-[#161629] p-6 transition hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-900/20"
                            >
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 transition group-hover:bg-primary-500/20">
                                    {f.icon}
                                </div>
                                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA bottom */}
            <section className="px-4 py-20 text-center sm:px-6">
                <div className="mx-auto max-w-2xl">
                    <h2 className="text-3xl font-bold text-white">
                        Ready to learn smarter?
                    </h2>
                    <p className="mt-4 text-slate-400">
                        Join SmartLearn AI and get a personalized study plan in minutes.
                    </p>
                    <a
                        href="/register"
                        className="mt-8 inline-block rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-500"
                    >
                        Create Free Account
                    </a>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
