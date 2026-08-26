import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { teacherService } from '../../services/teacherService';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Bot, ArrowRight, ShieldCheck } from 'lucide-react';

const TeacherAIAssistant = () => {
    const navigate = useNavigate();
    const [topicId, setTopicId] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [count, setCount] = useState(5);
    const [successPayload, setSuccessPayload] = useState(null);

    const generateMutation = useMutation({
        mutationFn: (data) => teacherService.generateQuestions(data),
        onSuccess: (res) => {
            setSuccessPayload(res.data?.data?.questions?.length || 0);
        }
    });

    const handleGenerate = (e) => {
        e.preventDefault();
        // Since we are mocking topic select for speed:
        generateMutation.mutate({
            topicId: topicId || "64f9b8c3d9a1f2b3e4f5a6b7",
            difficulty,
            questionCount: count
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-800 flex items-center">
                    <Sparkles className="w-8 h-8 mr-3 text-amber-500" /> AI Question Assistant
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Instantly draft question variations. All synthesized content is safely injected into a draft state in your Question Bank, requiring your explicit approval before students can see them.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Generation Block */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                    <form onSubmit={handleGenerate} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Topic ID</label>
                            <input
                                type="text"
                                placeholder="Paste Target Topic ID"
                                value={topicId}
                                onChange={(e) => setTopicId(e.target.value)}
                                className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Complexity</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={generateMutation.isLoading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {generateMutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Synthesize Drafts via AI'}
                        </button>
                    </form>
                </div>

                {/* Status Window */}
                <div className="h-full">
                    {successPayload === null && !generateMutation.isLoading && !generateMutation.isError && (
                        <div className="h-full border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50">
                            <Bot className="w-12 h-12 mb-4" />
                            <p className="font-medium">Configure parameters to draft questions effortlessly.</p>
                            <div className="flex items-center text-xs mt-4 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-bold">
                                <ShieldCheck className="w-4 h-4 mr-1.5" /> Human-in-the-Loop Safe
                            </div>
                        </div>
                    )}
                    {generateMutation.isLoading && (
                        <div className="h-full border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-white shadow-sm">
                            <Loader2 className="w-12 h-12 mb-4 animate-spin text-amber-500" />
                            <p className="font-bold text-slate-700">Synthesizing Educational Material...</p>
                        </div>
                    )}
                    {generateMutation.isError && (
                        <div className="h-full border border-red-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-red-50 shadow-sm text-red-600">
                            <p className="font-bold">Generation Failed</p>
                            <p className="text-sm mt-1">{generateMutation.error?.response?.data?.error || 'Unknown Error'}</p>
                        </div>
                    )}
                    {successPayload !== null && (
                        <div className="h-full border border-emerald-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-emerald-50 shadow-sm">
                            <div className="bg-emerald-100 p-4 rounded-full mb-4 border border-emerald-200">
                                <ShieldCheck className="w-12 h-12 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-black text-emerald-800 mb-2">Success!</h2>
                            <p className="text-emerald-700 font-medium mb-6">Generated {successPayload} questions perfectly injected into draft state.</p>

                            <button
                                onClick={() => navigate('/teacher/questions')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center shadow-lg shadow-emerald-500/30"
                            >
                                Review & Approve Content <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherAIAssistant;
