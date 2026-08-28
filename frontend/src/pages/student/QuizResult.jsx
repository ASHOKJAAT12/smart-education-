import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quizService } from '../../services/quizService';
import {
    CheckCircle2,
    XCircle,
    BarChart3,
    Clock,
    HelpCircle,
    ArrowRight,
    BrainCircuit,
    AlertTriangle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * Quiz result breakdown.
 *
 * `answer.selectedOption` and `question.correctAnswer` are both ZERO-BASED
 * INDEXES into `question.options`. They are resolved to display text here —
 * rendering the raw number would show the student "2" instead of their answer.
 */

/** Resolve an option index to its display text, tolerating missing data. */
const optionText = (options, index) => {
    if (index === null || index === undefined) return null;
    if (!Array.isArray(options)) return null;
    return options[index] ?? null;
};

const QuizResult = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ['attempt-result', attemptId],
        queryFn: () => quizService.getAttempt(attemptId),
        staleTime: Infinity, // a submitted attempt is immutable
    });

    // ─── Loading skeleton ───────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4" role="status" aria-live="polite">
                <span className="sr-only">Loading your results…</span>
                <div className="h-48 rounded-3xl bg-slate-200 animate-pulse mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
                    ))}
                </div>
                <div className="space-y-6">
                    {[0, 1].map((i) => (
                        <div key={i} className="h-40 rounded-2xl bg-slate-200 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // ─── Error + retry ──────────────────────────────────────────────────────
    if (isError) {
        return (
            <div className="max-w-md mx-auto py-16 px-4 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" aria-hidden="true" />
                <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to load your results</h1>
                <p className="text-slate-600 mb-6">
                    {error?.response?.data?.message ||
                        'Something went wrong loading this attempt. Your progress has been saved.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
                    >
                        {isFetching ? 'Retrying…' : 'Retry'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/student/dashboard')}
                        className="px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
                    >
                        Back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    const attempt = data?.data?.data;
    if (!attempt) {
        return (
            <div className="max-w-md mx-auto py-16 px-4 text-center">
                <h1 className="text-xl font-bold text-slate-800 mb-2">Result not found</h1>
                <p className="text-slate-600 mb-6">We could not find this quiz attempt.</p>
                <Link
                    to="/student/quizzes"
                    className="inline-block px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Browse quizzes
                </Link>
            </div>
        );
    }

    const passingScore = attempt.quizId?.passingScore ?? 70;
    const isPassed = attempt.scorePercentage >= passingScore;
    const answers = attempt.answers ?? [];

    return (
        <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4">
            {/* Result banner — status is stated in text, not colour alone. */}
            <div
                className={`rounded-3xl p-6 sm:p-8 md:p-12 text-white mb-8 ${
                    isPassed ? 'bg-emerald-700' : 'bg-rose-700'
                }`}
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <p className="flex items-center justify-center md:justify-start gap-2 text-white/90 font-semibold mb-2">
                            {isPassed ? (
                                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                            ) : (
                                <XCircle className="w-5 h-5" aria-hidden="true" />
                            )}
                            {isPassed ? 'Passed' : 'Not passed'}
                        </p>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">
                            {attempt.quizId?.title || attempt.quizTitleSnapshot || 'Quiz results'}
                        </h1>
                        <p className="text-white/80">
                            Passing score is {passingScore}%. Your progress and recommendations have been updated.
                        </p>
                    </div>
                    <div className="text-center shrink-0">
                        <p className="text-5xl sm:text-6xl font-black">{attempt.scorePercentage}%</p>
                        <p className="text-white/80 font-semibold mt-1 uppercase text-xs tracking-widest">
                            Final score
                        </p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
                <MetricCard
                    icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" aria-hidden="true" />}
                    label="Correct"
                    value={attempt.correctCount ?? 0}
                />
                <MetricCard
                    icon={<XCircle className="w-6 h-6 text-rose-600" aria-hidden="true" />}
                    label="Incorrect"
                    value={attempt.incorrectCount ?? 0}
                />
                <MetricCard
                    icon={<HelpCircle className="w-6 h-6 text-amber-600" aria-hidden="true" />}
                    label="Unanswered"
                    value={attempt.unansweredCount ?? 0}
                />
                <MetricCard
                    icon={<Clock className="w-6 h-6 text-blue-600" aria-hidden="true" />}
                    label="Submitted"
                    value={
                        attempt.submittedAt
                            ? new Date(attempt.submittedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : '—'
                    }
                />
            </div>

            {/* Next action */}
            <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white mb-10 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <div className="flex items-start sm:items-center gap-4">
                    <BrainCircuit className="w-8 h-8 text-indigo-400 shrink-0" aria-hidden="true" />
                    <div>
                        <h2 className="font-bold">Your recommendations were refreshed</h2>
                        <p className="text-slate-400 text-sm">
                            Topics you found difficult now rank higher in your study plan.
                        </p>
                    </div>
                </div>
                <Link
                    to="/student/dashboard"
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold py-3 px-6 rounded-xl flex items-center justify-center transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-indigo-400"
                >
                    Go to dashboard
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Link>
            </div>

            {/* Per-question review */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-3 text-slate-500" aria-hidden="true" />
                Question breakdown
            </h2>

            {answers.length === 0 ? (
                <p className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
                    No answers were recorded for this attempt.
                </p>
            ) : (
                <ol className="space-y-6">
                    {answers.map((ans, i) => {
                        const question = ans.questionId ?? {};
                        const options = question.options;
                        const chosen = optionText(options, ans.selectedOption);
                        const correct = optionText(options, question.correctAnswer);
                        const isCorrect = ans.isCorrect === true;
                        const isUnanswered = ans.selectedOption === null || ans.selectedOption === undefined;

                        return (
                            <li
                                key={question._id ?? i}
                                className={`bg-white rounded-2xl p-5 sm:p-6 md:p-8 border-l-4 shadow-sm ${
                                    isCorrect ? 'border-emerald-500' : 'border-rose-500'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                                        <span className="text-slate-400 mr-2">Q{i + 1}.</span>
                                        {question.question || 'Question unavailable'}
                                    </h3>

                                    {/* Text label + icon so correctness is never colour-only. */}
                                    <p
                                        className={`flex items-center gap-1.5 text-sm font-bold shrink-0 ${
                                            isCorrect ? 'text-emerald-700' : 'text-rose-700'
                                        }`}
                                    >
                                        {isCorrect ? (
                                            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                                        ) : (
                                            <XCircle className="w-5 h-5" aria-hidden="true" />
                                        )}
                                        {isCorrect ? 'Correct' : 'Incorrect'}
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                            Your answer
                                        </p>
                                        <p
                                            className={`p-4 rounded-xl font-medium border ${
                                                isCorrect
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                                    : 'bg-rose-50 border-rose-200 text-rose-900'
                                            }`}
                                        >
                                            {isUnanswered ? (
                                                <span className="italic text-slate-600">Not answered</span>
                                            ) : (
                                                chosen ?? <span className="italic text-slate-600">Unavailable</span>
                                            )}
                                        </p>
                                    </div>

                                    {!isCorrect && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                                Correct answer
                                            </p>
                                            <p className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl font-medium">
                                                {correct ?? <span className="italic text-slate-600">Unavailable</span>}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {question.explanation && (
                                    <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                            Explanation
                                        </h4>
                                        <div className="prose prose-sm max-w-none text-slate-600">
                                            <ReactMarkdown>{question.explanation}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
};

const MetricCard = ({ icon, label, value }) => (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 flex flex-col items-center justify-center text-center">
        <div className="mb-2 bg-slate-50 p-3 rounded-full">{icon}</div>
        <p className="text-xl sm:text-2xl font-black text-slate-800">{value}</p>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
);

export default QuizResult;
