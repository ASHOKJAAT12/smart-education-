import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services/assessmentService';
import { Loader2, PlayCircle, Clock, BookOpen, AlertCircle } from 'lucide-react';
import ErrorMessage from '../../components/ui/ErrorMessage';

const AssessmentIntro = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const res = await assessmentService.getAssessmentById(assessmentId);
                setAssessment(res.data.assessment);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load test details');
            } finally {
                setLoading(false);
            }
        };
        fetchAssessment();
    }, [assessmentId]);

    const handleStart = async () => {
        setStarting(true);
        try {
            const res = await assessmentService.startAssessment(assessmentId);
            navigate(`/student/assessment/take/${res.data.attempt._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start assessment');
            setStarting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (error) return <ErrorMessage message={error} />;
    if (!assessment) return <div>Not found</div>;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">{assessment.title}</h1>
                    <p className="text-slate-600">{assessment.description}</p>
                </div>

                <div className="p-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Assessment Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                            <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Questions</p>
                                <p className="text-xl font-bold text-slate-800">{assessment.totalQuestions}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-amber-50 rounded-lg">
                            <Clock className="w-8 h-8 text-amber-600 mr-3" />
                            <div>
                                <p className="text-sm text-amber-600 font-medium">Duration</p>
                                <p className="text-xl font-bold text-slate-800">{assessment.durationMinutes} mins</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                            <AlertCircle className="w-8 h-8 text-purple-600 mr-3" />
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Topics</p>
                                <p className="text-xl font-bold text-slate-800">{assessment.topicIds?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-md font-semibold text-slate-800 mb-2">Instructions</h3>
                        <ul className="list-disc pl-5 text-slate-600 space-y-1">
                            <li>The timer starts immediately after you click Start.</li>
                            <li>Do not refresh the page during the assessment.</li>
                            <li>You can navigate between questions before submitting.</li>
                            <li>Once the time expires, answers will be auto-submitted.</li>
                        </ul>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleStart}
                            disabled={starting}
                            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        >
                            {starting ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : <PlayCircle className="mr-2 w-5 h-5" />}
                            {starting ? 'Preparing...' : 'Start Assessment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentIntro;
