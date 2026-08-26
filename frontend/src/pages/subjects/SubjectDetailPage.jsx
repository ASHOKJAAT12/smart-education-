import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getSubjectById } from '../../services/educationService';
import TopicCard from '../../components/education/TopicCard';
import EmptyState from '../../components/ui/EmptyState';

const SubjectDetailPage = () => {
    const { id } = useParams();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['subject', id],
        queryFn: () => getSubjectById(id).then((r) => r.data.data),
    });

    if (isLoading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (isError) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
            Subject not found.
        </div>
    );

    const subject = data;
    const topics = subject?.topics || [];
    const course = subject?.courseId;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Link to="/courses" className="hover:text-violet-400 transition-colors">Courses</Link>
                    {course && (
                        <>
                            <span>/</span>
                            <Link to={`/courses/${course._id}`} className="hover:text-violet-400 transition-colors truncate max-w-xs">
                                {course.title}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-slate-300 truncate max-w-xs">{subject.name}</span>
                </div>

                {/* Subject header */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">{subject.name}</h1>
                    {subject.description && <p className="text-slate-300">{subject.description}</p>}
                </div>

                {/* Topics */}
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                    Topics ({topics.length})
                </h2>

                {topics.length === 0 ? (
                    <EmptyState title="No topics yet" message="Topics will appear here once created." />
                ) : (
                    <div className="space-y-2">
                        {topics.map((topic) => (
                            <TopicCard key={topic._id} topic={topic} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectDetailPage;
