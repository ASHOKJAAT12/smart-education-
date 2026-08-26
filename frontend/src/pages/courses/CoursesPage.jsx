import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen } from 'lucide-react';
import { getCourses } from '../../services/educationService';
import CourseCard from '../../components/education/CourseCard';
import EmptyState from '../../components/ui/EmptyState';

const LEVELS = ['', 'beginner', 'intermediate', 'advanced'];

const CoursesPage = () => {
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['courses', { search, level, page }],
        queryFn: () => getCourses({ search, level: level || undefined, page, limit: 12 }).then((r) => r.data),
        keepPreviousData: true,
    });

    const courses = data?.data || [];
    const pagination = data?.pagination || {};

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-1">Courses</h1>
                    <p className="text-slate-400">Browse all available learning programmes</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                        />
                    </div>
                    <select
                        value={level}
                        onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                    >
                        <option value="">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>

                {/* Content */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-slate-800/60 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                )}

                {isError && (
                    <div className="text-center py-20 text-red-400">Failed to load courses. Ensure the backend is running.</div>
                )}

                {!isLoading && !isError && courses.length === 0 && (
                    <EmptyState icon={BookOpen} title="No courses found" message="Try adjusting your filters" />
                )}

                {!isLoading && courses.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {courses.map((course) => (
                                <CourseCard key={course._id} course={course} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-10">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm disabled:opacity-40 hover:border-violet-500 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-400">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm disabled:opacity-40 hover:border-violet-500 transition-colors"
                                >
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

export default CoursesPage;
