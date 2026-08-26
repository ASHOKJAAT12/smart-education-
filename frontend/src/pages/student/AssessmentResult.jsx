import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assessmentService } from '../../services/assessmentService';
import { Loader2, ArrowLeft, Target, TrendingUp, TrendingDown, BookOpen, AlertCircle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import ErrorMessage from '../../components/ui/ErrorMessage';

const AssessmentResult = () => {
    const { attemptId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await assessmentService.getResult(attemptId);
                setResult(res.data.result);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load result');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [attemptId]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (error) return <ErrorMessage message={error} />;
    if (!result) return <div>No result found</div>;

    const {
        overallScore, percentage, correctAnswers, incorrectAnswers, unansweredAnswers,
        topicPerformance, strongestTopic, weakestTopic, assessmentId
    } = result;

    const getMasteryColor = (level) => {
        switch (level) {
            case 'mastered': return 'bg-green-500';
            case 'good': return 'bg-blue-500';
            case 'needs_improvement': return 'bg-amber-500';
            case 'weak': return 'bg-red-500';
            default: return 'bg-slate-300';
        }
    };

    const getMasteryLabel = (level) => {
        return level.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <Link to="/student/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
                <ArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
            </Link>

            {/* Header section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Diagnostic Assessment Result</h1>
                        <p className="text-slate-600">{assessmentId?.title}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center 
                            ${percentage >= 80 ? 'border-green-500 text-green-600' : percentage >= 60 ? 'border-blue-500 text-blue-600' : percentage >= 40 ? 'border-amber-500 text-amber-600' : 'border-red-500 text-red-600'}"
                            style={{ borderColor: percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#3b82f6' : percentage >= 40 ? '#f59e0b' : '#ef4444' }}
                        >
                            <span className="text-3xl font-bold">{percentage}%</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                        <div>
                            <p className="text-sm text-green-600 font-medium">Correct</p>
                            <p className="text-xl font-bold text-slate-800">{correctAnswers}</p>
                        </div>
                    </div>
                    <div className="flex items-center p-4 bg-red-50 rounded-lg">
                        <XCircle className="w-8 h-8 text-red-600 mr-3" />
                        <div>
                            <p className="text-sm text-red-600 font-medium">Incorrect</p>
                            <p className="text-xl font-bold text-slate-800">{incorrectAnswers}</p>
                        </div>
                    </div>
                    <div className="flex items-center p-4 bg-slate-100 rounded-lg">
                        <MinusCircle className="w-8 h-8 text-slate-500 mr-3" />
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Unanswered</p>
                            <p className="text-xl font-bold text-slate-800">{unansweredAnswers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Topic Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                    <Target className="w-6 h-6 mr-2 text-indigo-600" /> Topic Performance
                </h2>

                <div className="space-y-6">
                    {topicPerformance.map((topic, i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="w-32 font-medium text-slate-700">{topic.topicName}</div>
                            <div className="flex-1">
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getMasteryColor(topic.masteryLevel)}`}
                                        style={{ width: `${topic.accuracy}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="w-48 flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-700">{topic.accuracy}%</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${topic.masteryLevel === 'mastered' ? 'bg-green-100 text-green-700' :
                                        topic.masteryLevel === 'good' ? 'bg-blue-100 text-blue-700' :
                                            topic.masteryLevel === 'needs_improvement' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                    }`}>
                                    {getMasteryLabel(topic.masteryLevel)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis & Phase 6 Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-600" /> Strongest Area
                    </h3>
                    {strongestTopic ? (
                        <>
                            <p className="text-xl font-bold text-indigo-600 mb-2">{strongestTopic.name}</p>
                            <p className="text-slate-600 text-sm">You have a solid foundation here. Keep it up!</p>
                        </>
                    ) : (
                        <p className="text-slate-500">Not enough data to determine.</p>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <TrendingDown className="w-5 h-5 mr-2 text-red-600" /> Weakest Area
                    </h3>
                    {weakestTopic ? (
                        <>
                            <p className="text-xl font-bold text-rose-600 mb-2">{weakestTopic.name}</p>
                            <p className="text-slate-600 text-sm">This is an area that requires additional practice.</p>
                        </>
                    ) : (
                        <p className="text-slate-500">Not enough data to determine.</p>
                    )}
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-indigo-900 mb-2">Smart Recommendation Engine</h3>
                <p className="text-indigo-700">Your personalized learning path will be generated from these results.</p>
            </div>

        </div>
    );
};

export default AssessmentResult;
