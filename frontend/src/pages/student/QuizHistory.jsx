import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { learningService } from '../../services/quizService';
import { NavLink } from 'react-router-dom';
import { History, Calendar, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

const QuizHistory = () => {
    const { data: fetchRes, isLoading } = useQuery({
        queryKey: ['student-quiz-history'],
        queryFn: () => learningService.getQuizHistory()
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse text-indigo-600 font-semibold">Retrieving Attempt Ledgers...</div>;

    const history = fetchRes?.data?.data?.history || [];

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-8 flex items-center">
                <History className="w-8 h-8 mr-3 text-indigo-600" />
                Formal Execution Ledger
            </h1>

            {history.length > 0 ? (
                <div className="space-y-4">
                    {history.map((attempt) => {
                        const isPassed = attempt.scorePercentage >= (attempt.quizId?.passingScore || 70);
                        return (
                            <NavLink
                                to={`/student/quizzes/${attempt.quizId?._id}/result/${attempt._id}`}
                                key={attempt._id}
                                className="block bg-white hover:bg-slate-50 transition border border-slate-200 rounded-2xl p-6 shadow-sm group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">{attempt.quizId?.title || "Assessment Document"}</h3>
                                        <div className="flex items-center text-sm font-medium text-slate-500 space-x-4">
                                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(attempt.submittedAt).toLocaleDateString()}</span>
                                            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider text-xs">Topic: {attempt.topicId?.name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-2xl font-black text-slate-800">{attempt.scorePercentage}%</div>
                                            <div className="text-xs uppercase font-bold flex items-center mt-1">
                                                {isPassed ? <span className="text-emerald-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Passed</span> : <span className="text-rose-600 flex items-center"><XCircle className="w-3 h-3 mr-1" /> Needs Review</span>}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </NavLink>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                    <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Historical Data</h3>
                    <p className="text-slate-500 font-medium">You have not completed any formal quizzes yet.</p>
                </div>
            )}
        </div>
    );
};

export default QuizHistory;
