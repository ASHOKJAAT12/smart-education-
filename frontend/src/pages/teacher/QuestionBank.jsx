import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '../../services/teacherService';
import { FileQuestion, CheckCircle, XCircle, Loader2, Sparkles, AlertCircle, Edit2 } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const QuestionBank = () => {
    const queryClient = useQueryClient();
    const [filterState, setFilterState] = useState('all');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['teacher-questions'],
        queryFn: teacherService.getTeacherQuestions
    });

    const mutateQuestion = useMutation({
        mutationFn: ({ id, params }) => teacherService.updateQuestion(id, params),
        onSuccess: () => queryClient.invalidateQueries(['teacher-questions'])
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => teacherService.deleteQuestion(id),
        onSuccess: () => queryClient.invalidateQueries(['teacher-questions'])
    });

    if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
    if (isError) return <ErrorMessage message={error?.response?.data?.error || 'Failed to fetch question bank'} />;

    let questions = data?.data?.data?.items || data?.data?.data || [];

    // Derived states
    if (filterState === 'drafts') questions = questions.filter(q => !q.isPublished);
    if (filterState === 'published') questions = questions.filter(q => q.isPublished);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center">
                        <FileQuestion className="w-8 h-8 mr-3 text-violet-600" /> Question Bank
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Review AI drafts or manage your published educational content.</p>
                </div>

                <div className="flex p-1 bg-slate-200/50 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setFilterState('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterState === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >All</button>
                    <button
                        onClick={() => setFilterState('drafts')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${filterState === 'drafts' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Drafts
                    </button>
                    <button
                        onClick={() => setFilterState('published')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterState === 'published' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >Published</button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {questions.map(q => (
                    <div key={q._id} className={`p-6 rounded-2xl border transition-all ${q.isPublished ? 'bg-white border-slate-200 shadow-sm' : 'bg-amber-50/30 border-amber-200 relative overflow-hidden'}`}>
                        {/* Draft indicator stripe */}
                        {!q.isPublished && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></div>
                        )}

                        <div className="flex items-start justify-between">
                            <div className="flex-1 mr-6">
                                <div className="flex items-center space-x-3 mb-3">
                                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                                            q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-rose-100 text-rose-700'
                                        }`}>{q.difficulty}</span>

                                    {!q.isPublished ? (
                                        <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                            <Sparkles className="w-3 h-3 mr-1" /> Pending Review
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle className="w-3 h-3 mr-1" /> Published
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">{q.question}</h3>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {q.options.map((opt, i) => (
                                        <div key={i} className={`p-3 rounded-lg border text-sm font-medium ${i === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }`}>
                                            <span className="text-slate-400 text-xs mr-2">{String.fromCharCode(65 + i)}</span>
                                            {opt}
                                            {i === q.correctAnswer && <CheckCircle className="w-4 h-4 inline ml-2 text-emerald-500 border-none relative bottom-[1px]" />}
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4 text-sm text-violet-800">
                                    <strong className="block text-violet-900 mb-1 font-black uppercase text-[10px] tracking-wider">Explanation / Rationale</strong>
                                    {q.explanation}
                                </div>
                            </div>

                            {/* Actions Column */}
                            <div className="w-40 flex flex-col space-y-2 flex-shrink-0">
                                {!q.isPublished ? (
                                    <button
                                        onClick={() => mutateQuestion.mutate({ id: q._id, params: { isPublished: true } })}
                                        disabled={mutateQuestion.isLoading}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center text-sm shadow-sm"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => mutateQuestion.mutate({ id: q._id, params: { isPublished: false } })}
                                        disabled={mutateQuestion.isLoading}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center text-sm shadow-sm"
                                    >
                                        Withdraw Auth
                                    </button>
                                )}
                                <button className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl border border-slate-200 transition flex items-center justify-center text-sm shadow-sm">
                                    <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                                </button>
                                <button
                                    onClick={() => deleteMutation.mutate(q._id)}
                                    className="w-full hover:bg-red-50 text-slate-400 hover:text-red-600 font-bold py-2.5 rounded-xl transition flex items-center justify-center text-sm"
                                >
                                    <XCircle className="w-4 h-4 mr-1.5" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {questions.length === 0 && (
                    <div className="border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-50">
                        <FileQuestion className="w-12 h-12 mb-4" />
                        <p className="font-medium text-lg text-slate-600">No questions found.</p>
                        <p className="mt-1 text-sm">Use the AI Assistant to generate some material!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionBank;
