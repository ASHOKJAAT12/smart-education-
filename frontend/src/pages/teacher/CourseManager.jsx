import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, LayoutGrid, X } from 'lucide-react';
import { getCourses, createCourse } from '../../services/educationService';
import Spinner from '../../components/ui/Spinner';

const CourseManager = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['teacher-courses'],
        queryFn: () => getCourses({ limit: 50, published: 'all' }).then(r => r.data?.data || []),
    });

    if (isLoading) return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;

    if (error) return (
        <div className="p-10 flex flex-col items-center">
            <p className="text-red-400 font-bold text-xl mb-2">Error Loading Courses</p>
            <p className="text-slate-400">{error.message}</p>
        </div>
    );

    const courses = data;

    const createMutation = useMutation({
        mutationFn: (formData) => createCourse(formData),
        onSuccess: () => {
            queryClient.invalidateQueries(['teacher-courses']);
            setIsCreating(false);
        }
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);

        // Append required fields from DB Schema
        if (!f.get('title')) return alert('Title required');

        createMutation.mutate(f);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">My Courses</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage, edit, and publish your educational courses.</p>
                </div>
                <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                    <Plus className="w-5 h-5" /> Create Course
                </button>
            </div>

            {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            {course.thumbnail ? (
                                <img src={course.thumbnail} alt={course.title} className="w-full h-40 object-cover" />
                            ) : (
                                <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
                                    <LayoutGrid className="w-10 h-10 text-slate-300" />
                                </div>
                            )}

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">{course.category}</p>
                                    {course.isPublished ? (
                                        <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                                            <Eye className="w-3 h-3 mr-1" /> Published
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                            <EyeOff className="w-3 h-3 mr-1" /> Draft
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1">{course.title}</h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed flex-1">{course.description}</p>

                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                    <Link to={`/admin/courses/${course._id}`} className="flex-1 flex justify-center items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl text-sm font-bold transition-colors">
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </Link>
                                    <button className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Courses Found</h2>
                    <p className="text-slate-500 max-w-sm mb-6">You haven't created any courses yet. Start building your curriculum by adding your first course.</p>
                    <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                        <Plus className="w-5 h-5" /> Create Course
                    </button>
                </div>
            )}

            {/* Create Course Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm shadow-2xl">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">Create New Course</h2>
                            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Course Title *</label>
                                <input type="text" name="title" required className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400" placeholder="e.g. Advanced Mathematics" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea name="description" rows="3" className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 object-cover resize-none outline-none placeholder:text-slate-400" placeholder="Brief overview of the course curriculum..."></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Category *</label>
                                    <select name="category" required className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none">
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Physics">Physics</option>
                                        <option value="Biology">Biology</option>
                                        <option value="Literature">Literature</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Level *</label>
                                    <select name="level" required className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none">
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Thumbnail Cover (Optional)</label>
                                <input type="file" name="thumbnail" accept="image/*" className="w-full bg-slate-50 text-slate-700 border border-dashed border-slate-300 rounded-xl p-4 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" disabled={createMutation.isPending} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {createMutation.isPending && <Spinner size="sm" />} Create Draft
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManager;
