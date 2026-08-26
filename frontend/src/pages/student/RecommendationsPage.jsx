import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { learningService } from '../../services/learningService';
import { Loader2, Sparkles, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { Link } from 'react-router-dom';

const RecommendationsPage = () => {
    const { data: recResponse, isLoading: recLoading, error: recError } = useQuery({
        queryKey: ['recommendations'],
        queryFn: learningService.getRecommendations,
    });

    if (recLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-violet-600" /></div>;
    if (recError) return <ErrorMessage message={recError.message || "Failed to load"} />;

    const recommendations = recResponse?.data?.data?.recommendations || [];

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
            <div className="flex justify-between items-center bg-violet-600 rounded-2xl p-6 text-white shadow-lg border border-violet-500">
                <div>
                    <h1 className="text-3xl font-bold flex items-center mb-2">
                        <Sparkles className="w-6 h-6 mr-3 text-yellow-300" /> Personalized For You
                    </h1>
                    <p className="text-violet-200 text-sm max-w-lg">
                        These recommendations are generated dynamically based on your diagnostic assessments, recent quiz performances, and learning habits.
                    </p>
                </div>
                <div className="hidden md:block">
                    <Link to="/student/study-plan" className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-4 py-2 rounded-xl transition-colors">
                        View Today's Plan
                    </Link>
                </div>
            </div>

            {recommendations.length === 0 ? (
                <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
                    <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700">No Recommendations Yet</h2>
                    <p className="text-slate-500 mt-2 mb-6">Complete a diagnostic assessment or practice a topic to get your first recommendation.</p>
                    <Link to="/student/dashboard" className="text-violet-600 font-semibold hover:underline">
                        Take Assessment →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations.map((rec, index) => (
                        <div key={rec._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden group hover:border-violet-300 transition-colors">
                            {index === 0 && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center">
                                    Priority 1
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-slate-800 mb-1">{rec.topicId.name}</h3>
                            <div className="flex gap-2 mb-4">
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-violet-100 text-violet-700">
                                    Priority Score: {rec.priorityScore}
                                </span>
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                                    {rec.subjectId ? typeof rec.subjectId === 'object' ? rec.subjectId.name : 'Unknown Subject' : 'Subject'}
                                </span>
                            </div>

                            <div className="flex-1">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 h-full">
                                    <div className="flex items-start">
                                        <AlertCircle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Why?</p>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">"{rec.reason}"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to={`/student/topics/${rec.topicId._id}`}
                                className="w-full flex items-center justify-center p-3 mt-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors font-medium group"
                            >
                                {rec.recommendedAction}
                                <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecommendationsPage;
