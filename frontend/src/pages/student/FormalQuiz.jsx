import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quizService } from '../../services/quizService';
import { Loader2, ArrowRight, ArrowLeft, Clock, LogOut, AlertTriangle, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * Formal quiz runner.
 *
 * Answer contract: `answers` maps questionId -> ZERO-BASED OPTION INDEX, which is
 * what the API grades against Question.correctAnswer. Never send option text.
 */

const formatRemaining = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mins = String(Math.floor(total / 60)).padStart(2, '0');
    const secs = String(total % 60).padStart(2, '0');
    return `${mins}:${secs}`;
};

const FormalQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [attemptId, setAttemptId] = useState(null);
    const [expiresAt, setExpiresAt] = useState(null);
    const [answers, setAnswers] = useState({}); // questionId -> option index
    const [currentIndex, setCurrentIndex] = useState(0);
    const [now, setNow] = useState(Date.now());

    // Guards against React 18 StrictMode double-effect creating two attempts.
    const startRequested = useRef(false);

    const {
        data: quizResponse,
        isLoading: loadingQuiz,
        isError: quizError,
        error: quizErrorObj,
        refetch: refetchQuiz,
    } = useQuery({
        queryKey: ['formal-quiz', quizId],
        queryFn: () => quizService.getQuizById(quizId),
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    });

    const quiz = quizResponse?.data?.data;
    const questions = useMemo(() => quiz?.questions ?? [], [quiz]);

    const startMutation = useMutation({
        mutationFn: () => quizService.startQuiz(quizId),
        onSuccess: (res) => {
            setAttemptId(res.data.data.attemptId);
            setExpiresAt(res.data.data.expiresAt ?? null);
        },
    });

    const submitMutation = useMutation({
        mutationFn: (payload) => quizService.submitQuiz(attemptId, payload),
        onSuccess: (res) => {
            const finalAttemptId = res.data.data.attemptId;
            navigate(`/student/quizzes/${quizId}/result/${finalAttemptId}`, { replace: true });
        },
    });

    useEffect(() => {
        if (quiz && !startRequested.current) {
            startRequested.current = true;
            startMutation.mutate();
        }
    }, [quiz, startMutation]);

    const answeredCount = Object.keys(answers).length;
    const isSubmitting = submitMutation.isPending;

    const handleSubmission = useCallback(() => {
        if (isSubmitting) return; // prevents accidental double submission
        submitMutation.mutate({
            answers: questions.map((q) => ({
                questionId: q._id,
                // null explicitly marks "not answered" so the server can count it.
                selectedOption: answers[q._id] ?? null,
            })),
        });
    }, [answers, isSubmitting, questions, submitMutation]);

    // Countdown tick — only runs when the quiz is actually timed.
    useEffect(() => {
        if (!expiresAt) return undefined;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const remainingMs = expiresAt ? new Date(expiresAt).getTime() - now : null;

    // Auto-submit once time runs out so the attempt is never left dangling.
    useEffect(() => {
        if (remainingMs !== null && remainingMs <= 0 && attemptId && !isSubmitting) {
            handleSubmission();
        }
    }, [remainingMs, attemptId, isSubmitting, handleSubmission]);

    // ─── Loading ────────────────────────────────────────────────────────────
    if (loadingQuiz || (!attemptId && !startMutation.isError)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center" role="status" aria-live="polite">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" aria-hidden="true" />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Preparing your quiz…</h1>
                    <p className="text-slate-500 mt-2">This only takes a moment.</p>
                </div>
            </div>
        );
    }

    // ─── Error / recovery ───────────────────────────────────────────────────
    const loadError = quizError || startMutation.isError;
    if (loadError) {
        const message =
            startMutation.error?.response?.data?.message ||
            quizErrorObj?.response?.data?.message ||
            'We could not start this quiz right now.';

        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" aria-hidden="true" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to start quiz</h1>
                    <p className="text-slate-600 mb-6">{message}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                startRequested.current = false;
                                refetchQuiz();
                            }}
                            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
                        >
                            Try again
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/student/quizzes')}
                            className="px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
                        >
                            Back to quizzes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Empty state ────────────────────────────────────────────────────────
    const currentQ = questions[currentIndex];
    if (!currentQ) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <h1 className="text-xl font-bold text-slate-800 mb-2">No questions available</h1>
                    <p className="text-slate-600 mb-6">
                        This quiz does not have any questions yet. Please check back later.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/student/quizzes')}
                        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
                    >
                        Browse quizzes
                    </button>
                </div>
            </div>
        );
    }

    const isLast = currentIndex === questions.length - 1;
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
    const isTimeLow = remainingMs !== null && remainingMs < 60_000;

    return (
        <div className="bg-slate-50 min-h-screen pb-16">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-slate-800 font-bold shrink-0">
                        <span
                            className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm"
                            aria-hidden="true"
                        >
                            {currentIndex + 1}
                        </span>
                        <span className="text-sm sm:text-base">
                            <span className="sr-only">Question </span>
                            {currentIndex + 1} of {questions.length}
                        </span>
                    </p>

                    <h1 className="hidden sm:block text-sm md:text-base font-semibold text-slate-600 truncate px-4">
                        {quiz?.title}
                    </h1>

                    {remainingMs !== null ? (
                        <p
                            className={`flex items-center gap-2 font-semibold px-3 py-1.5 rounded-full text-sm shrink-0 ${
                                isTimeLow ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-100'
                            }`}
                            // Announce only near the end to avoid screen-reader spam every second.
                            aria-live={isTimeLow ? 'assertive' : 'off'}
                        >
                            <Clock className="w-4 h-4" aria-hidden="true" />
                            <span>
                                <span className="sr-only">Time remaining: </span>
                                {formatRemaining(remainingMs)}
                            </span>
                        </p>
                    ) : (
                        <p className="text-sm font-medium text-slate-500 shrink-0">Untimed</p>
                    )}
                </div>

                <div
                    className="h-1 bg-slate-100"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Quiz progress"
                >
                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-8 sm:pt-12 text-slate-800">
                <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm border border-slate-200 mb-8">
                    <div className="prose prose-slate max-w-none mb-8 sm:mb-10">
                        <ReactMarkdown>{currentQ.question}</ReactMarkdown>
                    </div>

                    {/* Native radios give us keyboard support and correct semantics for free. */}
                    <fieldset className="space-y-3 sm:space-y-4">
                        <legend className="sr-only">Select your answer</legend>

                        {currentQ.options.map((opt, index) => {
                            const isSelected = answers[currentQ._id] === index;
                            const inputId = `q-${currentQ._id}-opt-${index}`;

                            return (
                                <div key={inputId}>
                                    <input
                                        type="radio"
                                        id={inputId}
                                        name={`question-${currentQ._id}`}
                                        className="peer sr-only"
                                        checked={isSelected}
                                        onChange={() =>
                                            setAnswers((prev) => ({ ...prev, [currentQ._id]: index }))
                                        }
                                    />
                                    <label
                                        htmlFor={inputId}
                                        className={`flex items-center justify-between gap-3 w-full text-left p-4 sm:p-5 rounded-2xl border-2 cursor-pointer font-medium transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-indigo-600 ${
                                            isSelected
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                                                : 'border-slate-200 hover:border-indigo-400 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>{opt}</span>
                                        {/* Selection is conveyed by icon + border, not colour alone. */}
                                        {isSelected && (
                                            <Check className="w-5 h-5 text-indigo-700 shrink-0" aria-hidden="true" />
                                        )}
                                    </label>
                                </div>
                            );
                        })}
                    </fieldset>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="px-4 sm:px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
                    >
                        <ArrowLeft className="w-5 h-5 sm:mr-2" aria-hidden="true" />
                        <span className="hidden sm:inline">Previous</span>
                    </button>

                    {isLast ? (
                        <button
                            type="button"
                            onClick={handleSubmission}
                            disabled={isSubmitting}
                            className="px-6 sm:px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30 flex items-center disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    Submit attempt
                                    <LogOut className="w-5 h-5 ml-2" aria-hidden="true" />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                            }
                            className="px-6 sm:px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
                        >
                            Next
                            <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                        </button>
                    )}
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                    {answeredCount} of {questions.length} answered
                    {answeredCount < questions.length && ' — unanswered questions are marked incorrect.'}
                </p>

                {submitMutation.isError && (
                    <p className="mt-4 text-center text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                        {submitMutation.error?.response?.data?.message ||
                            'We could not submit your attempt. Please try again.'}
                    </p>
                )}
            </main>
        </div>
    );
};

export default FormalQuiz;
