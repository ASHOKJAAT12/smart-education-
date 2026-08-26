import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, FileText, Video, Image, Link2, File, BookOpen } from 'lucide-react';
import { getTopicById, getResources, getQuizzes } from '../../services/educationService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const RESOURCE_ICONS = { pdf: FileText, video: Video, image: Image, link: Link2, document: File };
const RESOURCE_COLORS = { pdf: 'text-red-400', video: 'text-violet-400', image: 'text-emerald-400', link: 'text-sky-400', document: 'text-amber-400' };

const TopicDetailPage = () => {
    const { id } = useParams();

    const { data: topicData, isLoading } = useQuery({
        queryKey: ['topic', id],
        queryFn: () => getTopicById(id).then((r) => r.data.data),
    });

    const { data: resourcesData } = useQuery({
        queryKey: ['resources', { topicId: id }],
        queryFn: () => getResources({ topicId: id }).then((r) => r.data),
        enabled: !!id,
    });

    const { data: quizzesData } = useQuery({
        queryKey: ['quizzes', { topicId: id }],
        queryFn: () => getQuizzes({ topicId: id }).then((r) => r.data),
        enabled: !!id,
    });

    if (isLoading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const topic = topicData;
    const resources = resourcesData?.data || [];
    const quizzes = quizzesData?.data || [];
    const subject = topic?.subjectId;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-4xl mx-auto px-4 py-10">
                <Link to={subject ? `/subjects/${subject._id}` : '/courses'} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-violet-400 text-sm mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {subject?.name || 'Back'}
                </Link>

                {/* Topic header */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge mapFrom="difficulty">{topic?.difficulty}</Badge>
                        {topic?.estimatedMinutes && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />{topic.estimatedMinutes} min
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{topic?.name}</h1>
                    {topic?.description && <p className="text-slate-300">{topic.description}</p>}
                </div>

                {/* Learning Resources */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-violet-400" />
                        Learning Resources ({resources.length})
                    </h2>
                    {resources.length === 0 ? (
                        <EmptyState title="No resources yet" message="Check back later for materials on this topic." />
                    ) : (
                        <div className="space-y-2">
                            {resources.map((res) => {
                                const Icon = RESOURCE_ICONS[res.type] || File;
                                const color = RESOURCE_COLORS[res.type] || 'text-slate-400';
                                return (
                                    <a
                                        key={res._id}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-violet-500/50 transition-all"
                                    >
                                        <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-100 truncate">{res.title}</p>
                                            {res.description && <p className="text-xs text-slate-400 truncate">{res.description}</p>}
                                        </div>
                                        <Badge variant="default" className="ml-auto flex-shrink-0">{res.type}</Badge>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Quizzes */}
                <section>
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-400" />
                        Quizzes ({quizzes.length})
                    </h2>
                    {quizzes.length === 0 ? (
                        <EmptyState title="No quizzes yet" message="Quizzes for this topic will appear here." />
                    ) : (
                        <div className="space-y-2">
                            {quizzes.map((quiz) => (
                                <Link
                                    key={quiz._id}
                                    to={`/quizzes/${quiz._id}`}
                                    className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-violet-500/50 transition-all"
                                >
                                    <div>
                                        <p className="font-medium text-slate-100">{quiz.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge mapFrom="difficulty">{quiz.difficulty}</Badge>
                                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="w-3 h-3" />{quiz.durationMinutes} min
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-violet-400 border border-violet-500/30 px-2 py-1 rounded-lg">Start</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default TopicDetailPage;
