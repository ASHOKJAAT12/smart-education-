import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { learningService } from '../../services/quizService';
import { Target, TrendingUp, Sparkles, BookOpen } from 'lucide-react';

const StudentProgress = () => {
    const { data: fetchRes, isLoading } = useQuery({
        queryKey: ['overall-progress-analytics'],
        queryFn: () => learningService.getProgressAnalytics()
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse text-indigo-600 font-semibold">Running Deep Analytics Engine...</div>;

    const data = fetchRes?.data?.data;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to recover analytics profile.</div>;

    const { streak, averageMastery, topics } = data;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-8 flex items-center">
                <TrendingUp className="w-8 h-8 mr-3 text-indigo-600" />
                Adaptive Educational Progress
            </h1>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-gradient-to-br from-indigo-600 flex justify-between to-violet-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 w-full flex justify-between items-center">
                        <div>
                            <p className="text-indigo-200 font-semibold uppercase tracking-wider mb-2">Global Mastery Matrix</p>
                            <div className="text-6xl font-black">{averageMastery}%</div>
                        </div>
                        <Target className="w-20 h-20 text-white/20" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 flex justify-between to-orange-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 w-full flex justify-between items-center">
                        <div>
                            <p className="text-amber-200 font-semibold uppercase tracking-wider mb-2">Unbroken Learning Chain</p>
                            <div className="text-5xl font-black">{streak} <span className="text-2xl font-bold">Days Flame</span></div>
                        </div>
                        <Sparkles className="w-20 h-20 text-white/20" />
                    </div>
                </div>
            </div>

            {/* Micro Breakdown */}
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><BookOpen className="w-5 h-5 mr-3 text-slate-400" /> Topic-Level Mastery</h2>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {topics.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-semibold">Concept Name</th>
                                <th className="p-4 font-semibold">Mastery Score</th>
                                <th className="p-4 font-semibold">Evaluated Standing</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {topics.map((t, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-bold text-slate-800">{t.name}</td>
                                    <td className="p-4 font-semibold">
                                        <div className="flex items-center">
                                            <div className="w-16 h-2 rounded-full bg-slate-100 mr-3 overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${t.masteryScore}%` }}></div>
                                            </div>
                                            {t.masteryScore}%
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-medium capitalize text-slate-600">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.level === 'advanced' ? 'bg-emerald-100 text-emerald-800' :
                                                t.level === 'intermediate' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                                            }`}>{t.level}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-slate-500 italic">No formal progress recorded yet. Execute adaptive practice or quizzes to populate.</div>
                )}
            </div>
        </div>
    );
};

export default StudentProgress;
