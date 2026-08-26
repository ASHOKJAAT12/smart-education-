import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningService } from '../../services/learningService';
import { Loader2, Calendar, Target, CheckCircle, Clock, PlayCircle, BookOpen, RefreshCw } from 'lucide-react';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { Link } from 'react-router-dom';

const StudyPlan = () => {
    const queryClient = useQueryClient();

    const { data: planData, isLoading: planLoading, error: planError, refetch } = useQuery({
        queryKey: ['study-plan'],
        queryFn: learningService.getStudyPlan,
    });

    const generateMutation = useMutation({
        mutationFn: learningService.generateStudyPlan,
        onSuccess: () => {
            queryClient.invalidateQueries(['study-plan']);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ itemId, status }) => learningService.updateStudyPlanItem(itemId, status),
        onSuccess: () => {
            queryClient.invalidateQueries(['study-plan']);
        }
    });

    if (planLoading || generateMutation.isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-violet-600" /></div>;
    if (planError) return <ErrorMessage message={planError.message || "Failed to load study plan"} />;

    const plan = planData?.data?.data?.plan;

    const handleGenerate = () => {
        generateMutation.mutate();
    };

    const handleStatusUpdate = (itemId, status) => {
        updateStatusMutation.mutate({ itemId, status });
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <Calendar className="w-8 h-8 mr-3 text-violet-600" /> Today's Study Plan
                    </h1>
                    <p className="text-slate-500 mt-1">A time-boxed optimal schedule to reach your goals.</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link to="/student/recommendations" className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                        View Full Recommendations Directory →
                    </Link>
                </div>
            </div>

            {!plan ? (
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
                    <Target className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">No Plan Active for Today</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        We can generate a smart study path structured exactly to your preferred
                        study duration mapping high priority weaknesses to actionable bytes.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={generateMutation.isLoading}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors flex items-center disabled:opacity-70"
                    >
                        {generateMutation.isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                        Generate Today's Plan
                    </button>
                    {generateMutation.isError && (
                        <p className="text-red-500 text-sm mt-3">{generateMutation.error?.response?.data?.error || 'Generation Failed'}</p>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                            <p className={`text-lg font-bold capitalize ${plan.status === 'completed' ? 'text-green-600' : 'text-amber-500'
                                }`}>{plan.status.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Target</p>
                            <p className="text-lg font-bold text-slate-800">{plan.totalMinutes} minutes</p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Items Included</p>
                            <p className="text-lg font-bold text-slate-800">{plan.items.length} tasks</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {plan.items.map((item, i) => (
                            <div key={item._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                    {item.status === 'completed' ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : item.status === 'in_progress' ? (
                                        <PlayCircle className="w-5 h-5 text-blue-500" />
                                    ) : item.status === 'skipped' ? (
                                        <div className="w-3 h-3 rounded-full bg-slate-400" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                                    )}
                                </div>

                                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border-2 shadow-sm transition-all ${item.status === 'completed' ? 'border-green-200 bg-green-50' :
                                        item.status === 'in_progress' ? 'border-blue-300 bg-blue-50' :
                                            item.status === 'skipped' ? 'border-slate-200 bg-slate-50 opacity-75' :
                                                'border-slate-200 bg-white hover:border-violet-300'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded capitalize ${item.activityType === 'learn' ? 'bg-indigo-100 text-indigo-700' :
                                                item.activityType === 'quiz' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-teal-100 text-teal-700'
                                            }`}>
                                            {item.activityType}
                                        </span>
                                        <span className="flex items-center text-xs font-medium text-slate-500">
                                            <Clock className="w-3 h-3 mr-1" /> {item.durationMinutes}m
                                        </span>
                                    </div>
                                    <h4 className={`text-lg font-bold mb-1 ${item.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                        {item.topicId?.name || 'Topic'}
                                    </h4>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {item.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(item._id, 'in_progress')} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition">Start Activity</button>
                                                <button onClick={() => handleStatusUpdate(item._id, 'skipped')} className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-300 transition">Skip</button>
                                            </>
                                        )}
                                        {item.status === 'in_progress' && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(item._id, 'completed')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition">Mark Completed</button>
                                                <button onClick={() => handleStatusUpdate(item._id, 'pending')} className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-50 transition">Pause</button>
                                            </>
                                        )}
                                        {(item.status === 'completed' || item.status === 'skipped') && (
                                            <button onClick={() => handleStatusUpdate(item._id, 'pending')} className="text-xs border border-slate-300 text-slate-500 px-3 py-1.5 rounded hover:bg-slate-50 transition">Undo</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyPlan;
