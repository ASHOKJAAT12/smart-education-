import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningService } from '../../services/quizService';
import { BookOpen, Sparkles, AlertCircle, PlayCircle, Clock, Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const TopicLearningPage = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();

    const { data: fetchRes, isLoading, isError } = useQuery({
        queryKey: ['topic-learning', topicId],
        queryFn: () => learningService.getTopicLearning(topicId)
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading Core Material...</div>;
    if (isError) return <div className="p-8 text-center text-red-500">Failed to load content for this concept.</div>;

    const { topic, resources, progress } = fetchRes?.data?.data || {};
    const score = progress?.masteryScore || 0;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Header / Mastery State */}
            <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <div className="flex items-center space-x-2 text-sm font-semibold text-violet-300 mb-3 uppercase tracking-wider">
                            <BookOpen className="w-4 h-4" />
                            <span>{topic?.subjectId?.name || "Topic Domain"}</span>
                        </div>
                        <h1 className="text-4xl font-extrabold mb-4">{topic?.name}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <span className="flex items-center"><Target className="w-4 h-4 mr-1" /> {topic?.difficulty || 'Adaptive'}</span>
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {topic?.estimatedMinutes || '30'} mins</span>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center shadow-lg w-full md:w-48">
                        <p className="text-slate-400 text-sm font-semibold mb-1 uppercase">Your Mastery</p>
                        <div className="text-4xl font-bold text-amber-400 flex items-center justify-center">
                            {score}% <Sparkles className="w-5 h-5 ml-2 text-amber-500/70" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 capitalize">{progress?.masteryLevel || 'Beginner'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    {/* Overview Segment */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-4">Topic Overview</h2>
                        <div className="prose prose-slate max-w-none text-slate-600">
                            <ReactMarkdown>{topic?.description || 'No detailed description available.'}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-4">Required Reading / Media</h2>
                        {resources?.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {resources.map((res, i) => (
                                    <a key={i} href={res.url} data-noinstant target="_blank" rel="noopener noreferrer" className="flex items-start p-4 bg-slate-50 hover:bg-violet-50 transition border border-slate-200 rounded-xl group">
                                        <PlayCircle className="w-8 h-8 text-violet-500 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                        <div>
                                            <h3 className="font-bold text-slate-800">{res.title}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-1">{res.description}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm italic">No static resources bound to this topic yet. Proceed to practice or AI explanations.</p>
                        )}
                    </div>
                </div>

                {/* Adaptive Action Bar */}
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
                        <h3 className="font-bold text-xl mb-2">Practice & Adapt</h3>
                        <p className="text-sm text-violet-200 mb-6">Real-time questions that scale based on your exact historical performance.</p>
                        <button onClick={() => navigate(`/student/topics/${topicId}/practice`)} className="w-full bg-white text-violet-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition flex items-center justify-center">
                            Start Practice <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>

                    <div className="bg-amber-100 rounded-2xl p-6 text-amber-900 border border-amber-200">
                        <h3 className="font-bold text-lg mb-2 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-amber-600" /> AI Capabilities</h3>
                        <p className="text-sm text-amber-700 mb-4">Confused? Let the AI Tutor break it down.</p>
                        <div className="space-y-2">
                            <Link to="/student/ai-tutor" className="block w-full text-center bg-amber-200 hover:bg-amber-300 text-amber-800 font-bold py-2.5 rounded-lg text-sm transition">
                                Open AI Tutor
                            </Link>
                            <Link to="/student/generate-quiz" className="block w-full text-center bg-amber-200 hover:bg-amber-300 text-amber-800 font-bold py-2.5 rounded-lg text-sm transition">
                                Generate Practice Quiz
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopicLearningPage;
