import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiService } from '../../services/aiService';
import { assessmentService } from '../../services/assessmentService';
import { Loader2, Sparkles, BookOpen, Check, AlertCircle } from 'lucide-react';

const AIQuizGenerator = () => {
    // We fetch subjects merely to allow user to pick a mapped topic for generation contexts
    // For brevity in hackathon, we assume the user just needs to input parameters
    const [topicId, setTopicId] = useState(''); // Would ideally be a dropdown derived from subjects array
    const [difficulty, setDifficulty] = useState('medium');
    const [count, setCount] = useState(5);
    const [resultData, setResultData] = useState(null);

    const generateMutation = useMutation({
        mutationFn: (data) => aiService.generateQuiz(data),
        onSuccess: (res) => {
            setResultData(res.data?.data?.questions || []);
        }
    });

    const handleGenerate = (e) => {
        e.preventDefault();
        generateMutation.mutate({ topicId: topicId || "64f9b8c3d9a1f2b3e4f5a6b7", difficulty, questionCount: count }); // fake topicId for demonstration if none provided
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    AI Quiz Generator <Sparkles className="w-8 h-8 ml-3 text-amber-500" />
                </h1>
                <p className="text-slate-500 mt-2">Instantly generate structured practice questions pushed right into your Quiz Engine.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 border border-slate-200 bg-white p-6 rounded-2xl shadow-sm h-fit">
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Topic ID</label>
                            <input
                                type="text"
                                placeholder="e.g. 64f..."
                                value={topicId}
                                onChange={(e) => setTopicId(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Difficulty</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question Count</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={generateMutation.isLoading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl transition flex items-center justify-center"
                        >
                            {generateMutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate via AI'}
                        </button>
                        {generateMutation.isError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start">
                                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                {generateMutation.error?.response?.data?.error || 'Generation Failed'}
                            </div>
                        )}
                    </form>
                </div>

                <div className="md:col-span-2">
                    {!resultData && !generateMutation.isLoading && (
                        <div className="h-full border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-50">
                            <BookOpen className="w-12 h-12 mb-4" />
                            <p>Configure parameters on the left to inject dynamic questions directly into the database.</p>
                        </div>
                    )}
                    {generateMutation.isLoading && (
                        <div className="h-full border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center bg-white shadow-sm">
                            <Loader2 className="w-12 h-12 mb-4 animate-spin text-amber-500" />
                            <p className="font-semibold text-slate-700">Synthesizing Educational Material...</p>
                        </div>
                    )}
                    {resultData && (
                        <div className="space-y-4">
                            <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl flex items-center shadow-sm">
                                <Check className="w-5 h-5 mr-3" />
                                <div>
                                    <h3 className="font-bold">Success!</h3>
                                    <p className="text-sm">Generated {resultData.length} valid questions and stored them directly into Phase 8 engine.</p>
                                </div>
                            </div>

                            {resultData.map((q, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                                    <p className="font-bold text-slate-800 mb-3">{idx + 1}. {q.title}</p>
                                    <div className="space-y-2 mb-4">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className={`p-2 rounded border text-sm ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 font-semibold' : 'bg-slate-50 border-slate-200'}`}>
                                                {opt} {opt === q.correctAnswer && "✅"}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-900">
                                        <span className="font-bold block mb-1">Explanation:</span>
                                        {q.explanation}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIQuizGenerator;
