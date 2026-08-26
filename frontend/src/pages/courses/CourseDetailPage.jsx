import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, BarChart2 } from 'lucide-react';
import { getCourseById } from '../../services/educationService';
import SubjectCard from '../../components/education/SubjectCard';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const CourseDetailPage = () => {
    const { id } = useParams();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['course', id],
        queryFn: () => getCourseById(id).then((r) => r.data.data),
    });

    if (isLoading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (isError) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
            Course not found or backend unavailable.
        </div>
    );

    const course = data;
    const subjects = course?.subjects || [];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-4xl mx-auto px-4 py-10">
                <Link to="/courses" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-violet-400 text-sm mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> All Courses
                </Link>

                {/* Course header */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden mb-8">
                    {course.thumbnail && (
                        <div className="h-48 bg-slate-700 overflow-hidden">
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="primary">{course.category}</Badge>
                            <Badge mapFrom="level">{course.level}</Badge>
                            {!course.isPublished && <Badge variant="warning">Draft</Badge>}
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
                        <p className="text-slate-300 leading-relaxed">{course.description}</p>
                        {course.createdBy && (
                            <p className="text-xs text-slate-500 mt-3">
                                Created by {course.createdBy.firstName} {course.createdBy.lastName}
                            </p>
                        )}
                    </div>
                </div>

                {/* Subjects */}
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                    Subjects ({subjects.length})
                </h2>

                {subjects.length === 0 ? (
                    <EmptyState title="No subjects yet" message="Subjects will appear here once added by a teacher or admin." />
                ) : (
                    <div className="space-y-2">
                        {subjects.map((subject) => (
                            <SubjectCard key={subject._id} subject={subject} courseId={id} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetailPage;
