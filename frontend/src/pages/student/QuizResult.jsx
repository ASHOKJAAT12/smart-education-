import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quizService } from '../../services/quizService';
import { CheckCircle2, XCircle, BarChart3, Clock, HelpCircle, ArrowRight, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const QuizResult = () => {
    const { attemptId } = useParams();

    const { data: attemptData, isLoading } = useQuery({
        queryKey: ['attempt-result', attemptId],
        queryFn: () => quizService.getAttempt(attemptId)
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse">Compiling detailed breakdown...</div>;

    const attempt = attemptData?.data?.data;
    if (!attempt) return <div className="p-8 text-center text-red-500">Attempt could not be recovered.</div>;

    const isPassed = attempt.scorePercentage >= (attempt.quizId?.passingScore || 70);

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">

            {/* Hero Result Banner */}
            <div className={`rounded-3xl p-8 md:p-12 text-white mb-8 relative overflow-hidden ${isPassed ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 uppercase tracking-wide">
                            {isPassed ? "Qualification Met" : "Requires Review"}
                        </h1>
                        <p className="text-white/80 font-medium text-lg">Your adaptive profile has formally updated.</p>
                    </div>
                    <div className="mt-6 md:mt-0 text-center">
                        <div className="text-6xl font-black">{attempt.scorePercentage}%</div>
                        <div className="text-white/70 font-semibold mt-1 uppercase text-sm tracking-widest">Final Score</div>
                    </div>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <MetricCard icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />} label="Correct" value={attempt.correctCount} />
                <MetricCard icon={<XCircle className="w-6 h-6 text-rose-500" />} label="Incorrect" value={attempt.incorrectCount} />
                <MetricCard icon={<HelpCircle className="w-6 h-6 text-amber-500" />} label="Omitted" value={attempt.unansweredCount} />
                <MetricCard icon={<Clock className="w-6 h-6 text-blue-500" />} label="Submitted" value={new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
            </div>

            {/* Post-execution Next Actions */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white mb-12 flex justify-between items-center shadow-lg shadow-slate-900/20">
                <div className="flex items-center">
                    <BrainCircuit className="w-8 h-8 text-indigo-400 mr-4" />
                    <div>
                        <h3 className="font-bold">Priority Matrices Updated Automatically</h3>
                        <p className="text-slate-400 text-sm">Your algorithm has shifted weights based on these answers.</p>
                    </div>
                </div>
                <Link to="/student/dashboard" className="bg-indigo-600 hover:bg-indigo-700 font-bold py-3 px-6 rounded-xl flex items-center transition">
                    Return to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
            </div>

            {/* Deep Dive Review */}
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center"><BarChart3 className="w-6 h-6 mr-3 text-slate-500" /> Exhaustive Breakdown</h2>
            <div className="space-y-6">
                {attempt.answers.map((ans, i) => {
                    const qData = ans.questionId;
                    const isCorrect = ans.isCorrect;

                    return (
                        <div key={i} className={`bg-white rounded-2xl p-6 md:p-8 border-l-4 shadow-sm ${isCorrect ? 'border-emerald-500' : 'border-rose-500'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-800"><span className="text-slate-400 mr-2">Q{i + 1}.</span> {qData.title}</h3>
                                {isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Your Final Pick</p>
                                    <div className={`p-4 rounded-xl font-medium border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                        {ans.selectedOption || <span className="italic opacity-70">No answer provided</span>}
                                    </div>
                                </div>
                                {!isCorrect && (
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Canonical Truth</p>
                                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl font-medium">
                                            {qData.correctAnswer}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Architectural Justification</h4>
                                <div className="prose prose-sm max-w-none text-slate-600">
                                    <ReactMarkdown>{qData.explanation || "No advanced justification mapped to this index."}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col items-center justify-center text-center">
        <div className="mb-2 bg-slate-50 p-3 rounded-full">{icon}</div>
        <div className="text-2xl font-black text-slate-800">{value}</div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{label}</div>
    </div>
);

export default QuizResult;
