import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    BookOpen, Target, Clock, ClipboardList, TrendingUp,
    CheckSquare, Zap, AlertCircle, ChevronRight, Sparkles,
    CalendarDays, Bot, ArrowRight
} from 'lucide-react';
import { getDashboard } from '../../services/authService';
import { assessmentService } from '../../services/assessmentService';
import { learningService } from '../../services/learningService';
// ─── Helpers ──────────────────────────────────────────────────────────────────

const goalLabel = {
    exam_prep: '🎯 Exam Preparation',
    deepen_knowledge: '🧠 Deepen Knowledge',
    career: '💼 Career Growth',
    revision: '🔄 Revision',
};

// ─── Stat card (empty state aware) ───────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color, empty }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
            <Icon className="w-4 h-4 text-white" />
        </div>
        {empty ? (
            <>
                <p className="text-2xl font-bold text-slate-600">—</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </>
        ) : (
            <>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </>
        )}
    </div>
);

// ─── Overview card ────────────────────────────────────────────────────────────

const OverviewCard = ({ label, value, icon: Icon, href }) => {
    const content = (
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex items-center gap-4 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-white truncate">{value || 'Not set'}</p>
            </div>
            {href && <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />}
        </div>
    );
    return href ? <Link to={href}>{content}</Link> : content;
};

// ─── Main dashboard ───────────────────────────────────────────────────────────

const StudentDashboard = () => {
    const { data: dashboardData, isLoading: dashboardLoading, isError, error } = useQuery({
        queryKey: ['student-dashboard'],
        queryFn: getDashboard,
        select: (r) => r.data,
    });

    const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
        queryKey: ['available-assessments'],
        queryFn: assessmentService.getAvailableAssessments,
    });

    const { data: recData } = useQuery({
        queryKey: ['recommendations'],
        queryFn: learningService.getRecommendations,
    });

    if (dashboardLoading || assessmentsLoading) return (
        <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
    );

    if (isError) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-slate-300 font-medium">Failed to load dashboard</p>
            <p className="text-slate-500 text-sm">{error?.response?.data?.error || 'Please try refreshing the page'}</p>
        </div>
    );

    const { profile, onboarding, content, diagnostic } = dashboardData;
    const availableAssessments = assessmentsData?.data?.assessments || [];
    const firstAssessmentId = availableAssessments.length > 0 ? availableAssessments[0]._id : null;
    const topRecommendation = recData?.data?.data?.recommendations?.[0] || null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-4">
                {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                        <span className="text-violet-300 font-bold">{profile.name?.[0]?.toUpperCase()}</span>
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-bold text-white">Welcome back, {profile.name?.split(' ')[0]}!</h1>
                    <p className="text-sm text-slate-400">
                        {onboarding.completed ? 'Your learning journey continues.' : 'Complete your profile setup to personalise your experience.'}
                    </p>
                </div>
            </div>

            {/* ── Onboarding incomplete banner ──────────────────────────── */}
            {!onboarding.completed && (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-yellow-300 text-sm">Setup incomplete</p>
                        <p className="text-xs text-yellow-400/70 mt-0.5">Finish setting up your profile to unlock personalised learning.</p>
                    </div>
                    <Link to="/student/onboarding" className="text-xs font-semibold text-yellow-300 hover:text-yellow-200 whitespace-nowrap transition-colors">
                        Complete →
                    </Link>
                </div>
            )}

            {/* ── Overview ──────────────────────────────────────────────── */}
            <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <OverviewCard
                        label="Current Course"
                        value={onboarding.course?.title}
                        icon={BookOpen}
                        href={onboarding.course ? `/courses/${onboarding.course._id}` : null}
                    />
                    <OverviewCard
                        label="Subjects Enrolled"
                        value={onboarding.subjects.length > 0 ? `${onboarding.subjects.length} subjects` : null}
                        icon={ClipboardList}
                        href="/student/subjects"
                    />
                    <OverviewCard
                        label="Learning Goal"
                        value={goalLabel[onboarding.learningGoal]}
                        icon={Target}
                    />
                    <OverviewCard
                        label="Daily Study Target"
                        value={onboarding.dailyStudyTime ? `${onboarding.dailyStudyTime} min / day` : null}
                        icon={Clock}
                    />
                </div>
            </section>

            {/* ── Diagnostic Assessment CTA (high-visibility) ───────────── */}
            {!diagnostic.taken && (
                <section>
                    <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/20 via-violet-600/10 to-slate-900 p-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                        <div className="relative flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-violet-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">Discover Your Learning Level</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    Take your diagnostic assessment to identify your strengths and weak areas.
                                    It only takes 10–15 minutes.
                                </p>
                                {firstAssessmentId ? (
                                    <Link
                                        to={`/student/assessment/intro/${firstAssessmentId}`}
                                        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                                    >
                                        <Zap className="w-4 h-4" />
                                        Start Assessment
                                    </Link>
                                ) : (
                                    <span className="text-sm text-slate-500 italic">No diagnostic assessments available yet.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Phase 6 Recommended for You ───────────── */}
            {topRecommendation && (
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-[#f59e0b]">🔥 Recommended For You</h2>
                        <Link to="/student/recommendations" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
                    </div>
                    <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-6 flex flex-col sm:flex-row items-center gap-6 group hover:border-amber-500/50 transition-colors">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800 mb-1">{topRecommendation.topicId?.name}</h3>
                            <p className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 mb-3">
                                Priority Score: {topRecommendation.priorityScore}
                            </p>
                            <div className="text-sm text-slate-600 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                <span className="font-semibold text-slate-700">Why?</span> "{topRecommendation.reason}"
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full sm:w-auto">
                            <Link
                                to={`/student/topics/${topRecommendation.topicId?._id}`}
                                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
                            >
                                {topRecommendation.recommendedAction}
                            </Link>
                            <Link
                                to="/student/study-plan"
                                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
                            >
                                View Today's Plan
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Phase 7 AI Assistant Panel ───────────── */}
            <section>
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
                    {/* Decorative blurred orbit background */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center mb-6">
                            <div className="bg-violet-500/20 p-2 rounded-xl border border-violet-500/30 mr-3">
                                <Bot className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    Need Help? Ask AI Tutor <Sparkles className="w-4 h-4 ml-2 text-yellow-500 hidden sm:block" />
                                </h2>
                                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                                    Instant answers, topic summaries, and customized study plans mapped directly to your learning profile.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {topRecommendation && (
                                <Link to={`/student/ai-tutor`} className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 p-4 rounded-xl transition-all group flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Priority Weakness</p>
                                        <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                                            Explain {topRecommendation.topicId?.name}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 mt-4 ml-auto" />
                                </Link>
                            )}

                            <Link to="/student/generate-quiz" className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 p-4 rounded-xl transition-all group flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Practice</p>
                                    <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                                        Generate AI Practice Quiz
                                    </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-300 mt-4 ml-auto" />
                            </Link>

                            <Link to="/student/ai-tutor" className="bg-violet-600 hover:bg-violet-500 border border-violet-500 shadow-lg shadow-violet-500/20 p-4 rounded-xl transition-all group flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-bold text-violet-200 uppercase tracking-wider mb-2">General</p>
                                    <p className="font-semibold text-white">
                                        Open Full Tutor Interface
                                    </p>
                                </div>
                                <Bot className="w-5 h-5 text-white/50 group-hover:text-white mt-4 ml-auto transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Learning Area ──────────────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Your Subjects</h2>
                    <Link to="/courses" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Browse all →</Link>
                </div>
                {onboarding.subjects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                        <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium text-sm">No subjects selected yet</p>
                        <p className="text-slate-600 text-xs mt-1 mb-4">Add subjects during onboarding or update your profile</p>
                        <Link to="/student/onboarding" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                            Update setup →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {onboarding.subjects.map((sub) => (
                            <Link
                                key={sub._id}
                                to={`/subjects/${sub._id}`}
                                className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-200 flex-1 truncate">{sub.name}</p>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Phase 8 Real Progress Stats ─────────────────── */}
            {dashboardData?.progressStats?.nextBestAction && (
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-[#10b981]">💡 Next Best Action</h2>
                    </div>
                    <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 flex items-center justify-between group transition-colors">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">{dashboardData.progressStats.nextBestAction.message}</h3>
                            <p className="text-sm text-emerald-700 font-semibold uppercase tracking-wider">{dashboardData.progressStats.nextBestAction.actionType}</p>
                        </div>
                        <Link
                            to={dashboardData.progressStats.nextBestAction.route}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
                        >
                            Continue
                        </Link>
                    </div>
                </section>
            )}

            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Progress Metrics</h2>
                    <div className="flex space-x-3 text-xs">
                        <Link to="/student/progress" className="text-violet-500 hover:text-violet-400 font-bold transition-colors">View Analytics</Link>
                        <Link to="/student/quiz-history" className="text-violet-500 hover:text-violet-400 font-bold transition-colors">Quiz History</Link>
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={TrendingUp} label="Overall Mastery" value={`${dashboardData?.progressStats?.overallMastery || 0}%`} color="bg-violet-600" empty={!dashboardData?.progressAvailable} />
                    <StatCard icon={CalendarDays} label="Current Streak" value={`${dashboardData?.progressStats?.streak || 0} Days`} color="bg-blue-600" empty={!dashboardData?.progressAvailable} />
                    <StatCard icon={CheckSquare} label="Topics In Progress" value={dashboardData?.progressStats?.completedTopics || 0} color="bg-emerald-600" empty={!dashboardData?.progressAvailable} />
                    <StatCard icon={Target} label="Quizzes Available" value={content.availableQuizCount} color="bg-amber-600" empty={false} />
                </div>
            </section>
        </div>
    );
};

export default StudentDashboard;
