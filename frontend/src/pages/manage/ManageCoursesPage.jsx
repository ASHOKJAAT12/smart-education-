import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Eye, EyeOff, BookOpen, LayoutDashboard } from 'lucide-react';
import { getCourses, deleteCourse } from '../../services/educationService';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Link } from 'react-router-dom';

const ManageCoursesPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'admin';

    // Teachers see their own courses; admins see all (published=all)
    const { data, isLoading } = useQuery({
        queryKey: ['manage-courses'],
        queryFn: () => getCourses({ published: 'all', limit: 50 }).then((r) => r.data),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteCourse(id),
        onSuccess: () => queryClient.invalidateQueries(['manage-courses']),
    });

    const handleDelete = (course) => {
        if (window.confirm(`Delete "${course.title}"? This cannot be undone.`)) {
            deleteMutation.mutate(course._id);
        }
    };

    const courses = data?.data || [];
    const myDisplay = isAdmin ? courses : courses.filter((c) => c.createdBy?._id === user?._id);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <LayoutDashboard className="w-6 h-6 text-violet-400" />
                            Manage Courses
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {isAdmin ? 'All courses (admin view)' : 'Your courses'}
                        </p>
                    </div>
                    <Link
                        to="/manage/courses/new"
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Course
                    </Link>
                </div>

                {isLoading && (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-800/60 rounded-xl animate-pulse" />)}
                    </div>
                )}

                {!isLoading && myDisplay.length === 0 && (
                    <EmptyState
                        icon={BookOpen}
                        title="No courses yet"
                        message="Create your first course to get started."
                        action={
                            <Link to="/manage/courses/new" className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl transition-colors">
                                Create Course
                            </Link>
                        }
                    />
                )}

                <div className="space-y-3">
                    {myDisplay.map((course) => (
                        <div key={course._id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                            <div className="flex items-center gap-3 min-w-0">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-violet-400" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-100 truncate">{course.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="primary">{course.category}</Badge>
                                        <Badge mapFrom="level">{course.level}</Badge>
                                        {course.isPublished ? (
                                            <span className="flex items-center gap-1 text-xs text-emerald-400"><Eye className="w-3 h-3" />Published</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-yellow-500"><EyeOff className="w-3 h-3" />Draft</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                                <Link
                                    to={`/courses/${course._id}`}
                                    className="text-xs text-slate-400 hover:text-violet-400 border border-slate-600 hover:border-violet-500/50 px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                    View
                                </Link>
                                <button
                                    onClick={() => handleDelete(course)}
                                    disabled={deleteMutation.isPending}
                                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageCoursesPage;
