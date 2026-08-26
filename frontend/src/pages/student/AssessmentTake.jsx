import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services/assessmentService';
import { Loader2, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import ErrorMessage from '../../components/ui/ErrorMessage';

const AssessmentTake = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const res = await assessmentService.getAttempt(attemptId);
                const fetchedAttempt = res.data.attempt;

                if (fetchedAttempt.status !== 'in_progress') {
                    navigate(`/student/assessment/result/${attemptId}`, { replace: true });
                    return;
                }

                setAttempt(fetchedAttempt);

                const ansMap = {};
                fetchedAttempt.answers?.forEach(a => ansMap[a.questionId] = a.selectedAnswer);
                setAnswers(ansMap);

                const expiry = new Date(fetchedAttempt.expiresAt).getTime();
                const now = new Date().getTime();
                setTimeLeft(Math.max(0, Math.floor((expiry - now) / 1000)));
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load assessment');
            } finally {
                setLoading(false);
            }
        };
        fetchAttempt();
    }, [attemptId, navigate]);

    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0 && !submitting) {
            handleSubmit(); // Auto submit
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    const handleAnswerSelect = (qId, optionIdx) => {
        setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
                questionId, selectedAnswer
            }));
            await assessmentService.submitAssessment(attemptId, formattedAnswers);
            navigate(`/student/assessment/result/${attemptId}`, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit assessment');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (error) return <ErrorMessage message={error} />;

    const questions = attempt.questions;
    const currentQ = questions[currentIdx].questionId;

    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const timeDisplay = `${m}:${s < 10 ? '0' : ''}${s}`;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Question {currentIdx + 1} of {questions.length}</h2>
                    <div className={`flex items-center px-4 py-2 rounded-full font-bold ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                        <Clock className="w-5 h-5 mr-2" />
                        {timeDisplay}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <p className="text-lg text-slate-800 mb-6">{currentQ.question}</p>
                    <div className="space-y-3">
                        {currentQ.options.map((opt, idx) => {
                            const isSelected = answers[currentQ._id] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswerSelect(currentQ._id, idx)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                                >
                                    <span className={`inline-block w-6 h-6 rounded-full border-2 text-center text-sm leading-5 mr-3 align-middle ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentIdx === 0}
                        className="flex items-center px-4 py-2 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" /> Previous
                    </button>
                    {currentIdx === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                            Submit
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                            className="flex items-center px-4 py-2 rounded text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Next <ChevronRight className="w-5 h-5 ml-1" />
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full md:w-72 hidden md:block">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
                    <h3 className="font-semibold text-slate-800 mb-4">Navigator</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = answers[q.questionId._id] !== undefined;
                            const isCurrent = currentIdx === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIdx(idx)}
                                    className={`w-10 h-10 rounded text-sm font-medium flex items-center justify-center transition-colors
                                        ${isCurrent ? 'ring-2 ring-blue-500' : ''}
                                        ${isAnswered ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                                    `}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to submit the assessment?')) {
                                    handleSubmit();
                                }
                            }}
                            disabled={submitting}
                            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentTake;
