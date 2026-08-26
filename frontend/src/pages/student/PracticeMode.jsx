import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { learningService, quizService } from '../../services/quizService';
import { BrainCircuit, Check, X, ArrowRight, Loader2, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PracticeMode = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();

    // Fetch intelligent practice session exactly matching adaptive boundaries
    const { data: practiceData, isLoading } = useQuery({
        queryKey: ['practice-session', topicId],
        queryFn: () => learningService.startPractice(topicId),
        refetchOnWindowFocus: false, // Freeze the pool
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [hasChecked, setHasChecked] = useState(false);
    const [score, setScore] = useState(0);

    const questions = practiceData?.data?.data?.questions || [];
    const currentQ = questions[currentIndex];

    // We construct a localized array to push to Attempt model if we wanted formalization later on
    // But practice remains isolated feedback loop here.

    const handleCheck = () => {
        if (!selectedOption) return;
        setHasChecked(true);
        if (selectedOption === currentQ.correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setHasChecked(false);
        } else {
            // End of practice chunk
            setCurrentIndex(questions.length); // Out of bounds flag
        }
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse"><Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-600 mb-4" /> Synthesizing adaptive question pool...</div>;

    // End State
    if (currentIndex >= questions.length && questions.length > 0) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 text-center">
                <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl">
                    <BrainCircuit className="w-20 h-20 mx-auto text-violet-500 mb-6" />
                    <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Practice Complete!</h2>
                    <p className="text-xl text-slate-600 mb-8">You scored <span className="font-bold text-violet-600">{score}</span> out of {questions.length}.</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => window.location.reload()} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-xl transition flex items-center">
                            <RefreshCcw className="w-5 h-5 mr-2" /> Practice Again
                        </button>
                        <button onClick={() => navigate(`/student/topics/${topicId}/learn`)} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center">
                            Finish <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (questions.length === 0) return <div className="p-8 text-center text-slate-500">No practice questions available for this topic yet.</div>;

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="mb-8 flex justify-between items-center text-sm font-semibold text-slate-500">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="bg-slate-100 px-3 py-1 text-xs rounded-full uppercase tracking-wider border border-slate-200">
                    Difficulty: <span className="text-violet-600">{currentQ.difficulty}</span>
                </span>
            </div>

            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-8 leading-snug">{currentQ.title}</h2>

                <div className="space-y-4">
                    {currentQ.options.map((opt, i) => {
                        let btnClass = "border-slate-200 hover:border-violet-500 hover:bg-violet-50 text-slate-700";
                        if (hasChecked) {
                            if (opt === currentQ.correctAnswer) btnClass = "border-green-500 bg-green-50 text-green-900 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]";
                            else if (opt === selectedOption) btnClass = "border-red-500 bg-red-50 text-red-900";
                            else btnClass = "border-slate-200 opacity-50";
                        } else if (opt === selectedOption) {
                            btnClass = "border-violet-600 bg-violet-50 text-violet-900 shadow-[0_0_0_2px_rgba(124,58,237,0.2)]";
                        }

                        return (
                            <button
                                key={i}
                                disabled={hasChecked}
                                onClick={() => setSelectedOption(opt)}
                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-medium flex items-center justify-between ${btnClass}`}
                            >
                                <span>{opt}</span>
                                {hasChecked && opt === currentQ.correctAnswer && <Check className="w-5 h-5 text-green-600" />}
                                {hasChecked && opt === selectedOption && opt !== currentQ.correctAnswer && <X className="w-5 h-5 text-red-600" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {hasChecked && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className={`p-6 rounded-2xl border mb-6 ${selectedOption === currentQ.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className={`font-bold mb-2 flex items-center ${selectedOption === currentQ.correctAnswer ? 'text-green-800' : 'text-red-800'}`}>
                            {selectedOption === currentQ.correctAnswer ? <Check className="w-5 h-5 mr-2" /> : <X className="w-5 h-5 mr-2" />}
                            {selectedOption === currentQ.correctAnswer ? "Correct!" : "Incorrect."}
                        </h3>
                        <div className="prose prose-sm max-w-none text-slate-700">
                            <ReactMarkdown>{currentQ.explanation || "No advanced explanation provided."}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end mt-8">
                {!hasChecked ? (
                    <button
                        onClick={handleCheck}
                        disabled={!selectedOption}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Check Answer
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 px-10 rounded-2xl transition flex items-center shadow-lg shadow-violet-500/20"
                    >
                        {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'} <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PracticeMode;
