import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, Search } from 'lucide-react';
import { getQuizzes } from '../../services/educationService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const QuizListPage = () => {
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['quizzes', { search, difficulty, page }],
        queryFn: () => getQuizzes({ search, difficulty: difficulty || undefined, page, limit: 15 }).then((r) => r.data),
        keepPreviousData: true,
    });

    const quizzes = data?.data || [];
    const pagination = data?.pagination || {};

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-1">Quizzes</h1>
                    <p className="text-slate-400">Test your understanding</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search quizzes..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                        />
                    </div>
                    <select
                        value={difficulty}
                        onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                    >
                        <option value="">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="mixed">Mixed</option>
                    </select>
                </div>

                {isLoading && (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-800/60 rounded-xl animate-pulse" />)}
                    </div>
                )}

                {isError && (
                    <div className="text-center py-20 text-red-400">Failed to load quizzes. Please log in.</div>
                )}

                {!isLoading && !isError && quizzes.length === 0 && (
                    <EmptyState icon={BookOpen} title="No quizzes found" message="Check back later or adjust your filters." />
                )}

                {!isLoading && quizzes.length > 0 && (
                    <>
                        <div className="space-y-3">
                            {quizzes.map((quiz) => (
                                <Link
                                    key={quiz._id}
                                    to={`/quizzes/${quiz._id}`}
                                    className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:border-violet-500/50 hover:bg-slate-800 transition-all"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-100 mb-1">{quiz.title}</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge mapFrom="difficulty">{quiz.difficulty}</Badge>
                                            {quiz.subjectId && <Badge variant="primary">{quiz.subjectId.name}</Badge>}
                                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="w-3 h-3" />{quiz.durationMinutes} min
                                            </span>
                                            <span className="text-xs text-slate-400">Pass: {quiz.passingScore}%</span>
                                        </div>
                                    </div>
                                    <span className="text-sm text-violet-400 border border-violet-500/30 px-3 py-1.5 rounded-lg hover:bg-violet-500/10 transition-colors">
                                        Start →
                                    </span>
                                </Link>
                            ))}
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-8">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm disabled:opacity-40 hover:border-violet-500 transition-colors">
                                    Previous
                                </button>
                                <span className="text-sm text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
                                <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm disabled:opacity-40 hover:border-violet-500 transition-colors">
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default QuizListPage;
