import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assessmentService } from '../../services/assessmentService';
import { Loader2, Calendar, Target, BookOpen, Clock } from 'lucide-react';
import ErrorMessage from '../../components/ui/ErrorMessage';

const AssessmentHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await assessmentService.getMyResults({ limit: 50 });
                setHistory(res.data.results);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load assessment history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Diagnostic Assessment History</h1>
                    <p className="text-slate-600">Review your past performances.</p>
                </div>
                <Link to="/student/dashboard" className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors">
                    Back to Dashboard
                </Link>
            </div>

            {history.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Assessments Yet</h3>
                    <p className="text-slate-500">You haven't taken any diagnostic assessments.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <ul className="divide-y divide-slate-100">
                        {history.map((result) => (
                            <li key={result._id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-800 mb-1">
                                        {result.assessmentId?.title || 'Unknown Assessment'}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(result.completedAt).toLocaleDateString()}</span>
                                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold flex items-center justify-end text-slate-800">
                                            {result.percentage}%
                                        </div>
                                        <div className="flex text-sm font-medium gap-2 mt-1">
                                            <span className="text-green-600">{result.correctAnswers} Correct</span>
                                            <span className="text-rose-600">{result.incorrectAnswers + result.unansweredAnswers} Missed</span>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/student/assessment/result/${result.attemptId}`}
                                        className="p-2 border border-slate-300 rounded text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AssessmentHistory;
