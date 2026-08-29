import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, BarChart2, FileText, Video, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { getCourseById, getCourseMaterials } from '../../services/educationService';
import SubjectCard from '../../components/education/SubjectCard';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const CourseDetailPage = () => {
    const { id } = useParams();

    const { data: courseData, isLoading: isCourseLoading, isError: isCourseError } = useQuery({
        queryKey: ['course', id],
        queryFn: () => getCourseById(id).then((r) => r.data.data),
    });

    const { data: materials, isLoading: isMaterialsLoading } = useQuery({
        queryKey: ['course-materials-public', id],
        queryFn: () => getCourseMaterials(id).then(r => r.data.data),
    });

    if (isCourseLoading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (isCourseError) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
            Course not found or backend unavailable.
        </div>
    );

    const course = courseData;
    const subjects = course?.subjects || [];

    const TYPE_ICONS = {
        pdf: FileText,
        video: Video,
        image: ImageIcon,
        link: LinkIcon,
        document: FileText
    };

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

                {/* Course Materials */}
                <h2 className="text-lg font-semibold text-white mb-4 mt-10 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    Study Materials ({materials?.length || 0})
                </h2>

                {isMaterialsLoading ? (
                    <div className="h-20 bg-slate-800/40 rounded-2xl animate-pulse" />
                ) : !materials || materials.length === 0 ? (
                    <EmptyState title="No materials" message="No study materials have been published for this course yet." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {materials.map((mat) => {
                            const Icon = TYPE_ICONS[mat.type] || FileText;
                            return (
                                <a
                                    key={mat._id}
                                    href={mat.url}
                                    data-noinstant
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl p-4 transition-colors flex items-start gap-4 group"
                                >
                                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-indigo-900/50 transition-colors">
                                        <Icon className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-100 truncate">{mat.title}</h3>
                                            <Badge variant="primary" className="text-[10px] uppercase">{mat.type}</Badge>
                                        </div>
                                        {mat.description && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{mat.description}</p>}
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetailPage;
