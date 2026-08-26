import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quizService } from '../../services/quizService';
import { Loader2, ArrowRight, ArrowLeft, Clock, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const FormalQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    // Context & Attempt Tracker
    const [attemptId, setAttemptId] = useState(null);
    const [answers, setAnswers] = useState({}); // Mapping of questionId -> selectedOption
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data: quizData, isLoading: loadingQuiz } = useQuery({
        queryKey: ['formal-quiz', quizId],
        queryFn: () => quizService.getQuizById(quizId),
        refetchOnWindowFocus: false,
    });

    const startMutation = useMutation({
        mutationFn: () => quizService.startQuiz(quizId),
        onSuccess: (res) => {
            setAttemptId(res.data.data.attemptId);
        }
    });

    const submitMutation = useMutation({
        mutationFn: (payload) => quizService.submitQuiz(attemptId, payload),
        onSuccess: (res) => {
            const finalAttemptId = res.data.data.attemptId;
            navigate(`/student/quizzes/${quizId}/result/${finalAttemptId}`, { replace: true });
        }
    });

    // Start intrinsically
    useEffect(() => {
        if (quizData && !attemptId && !startMutation.isPending) {
            startMutation.mutate();
        }
    }, [quizData]);

    if (loadingQuiz || !attemptId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800">Initializing Secure Environment...</h2>
                </div>
            </div>
        );
    }

    const quiz = quizData?.data?.data;
    const questions = quiz?.questions || [];
    const currentQ = questions[currentIndex];

    // Ensure answers array maps to correct formatting
    const handleSubmission = () => {
        const payload = {
            answers: Object.keys(answers).map(qId => ({ questionId: qId, selectedOption: answers[qId] }))
        };
        submitMutation.mutate(payload);
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-16">
            {/* Header Lock */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-slate-800 font-bold">
                        <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">{currentIndex + 1}</span>
                        <span>/ {questions.length}</span>
                    </div>
                    <h1 className="text-sm md:text-base font-semibold text-slate-600 truncate px-4">{quiz?.title}</h1>
                    <div className="flex items-center space-x-2 text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-full text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Live Session</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-12 text-slate-800">
                {/* Question Block */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 mb-8 transition-all">
                    <div className="prose prose-lg max-w-none mb-10 text-slate-800">
                        <ReactMarkdown>{currentQ.question}</ReactMarkdown>
                    </div>

                    <div className="space-y-4">
                        {currentQ.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => setAnswers({ ...answers, [currentQ._id]: opt })}
                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-medium  ${answers[currentQ._id] === opt
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-[0_0_0_2px_rgba(79,70,229,0.2)]'
                                        : 'border-slate-200 hover:border-indigo-400 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between mt-8">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Previous
                    </button>

                    {currentIndex === questions.length - 1 ? (
                        <button
                            onClick={handleSubmission}
                            disabled={submitMutation.isPending}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30 flex items-center disabled:opacity-50"
                        >
                            {submitMutation.isPending ? "Evaluating..." : "Submit Attempt"} <LogOut className="w-5 h-5 ml-2" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center"
                        >
                            Next Question <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FormalQuiz;
