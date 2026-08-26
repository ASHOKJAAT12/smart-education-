import React, { useState, useContext, createContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, ChevronLeft, Check, Clock, Target, GraduationCap } from 'lucide-react';
import { getCourses, getSubjects } from '../../services/educationService';
import { completeOnboarding } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

// ─── Step data ────────────────────────────────────────────────────────────────

const GOALS = [
    { value: 'exam_prep', label: '🎯 Exam Preparation', desc: 'Get ready for upcoming exams and tests' },
    { value: 'deepen_knowledge', label: '🧠 Deepen Knowledge', desc: 'Truly understand concepts beyond the syllabus' },
    { value: 'career', label: '💼 Career Growth', desc: 'Build skills for professional advancement' },
    { value: 'revision', label: '🔄 Revision', desc: 'Refresh and solidify what you already know' },
];

const STUDY_TIMES = [
    { value: 15, label: '15 min', desc: 'Quick daily review' },
    { value: 30, label: '30 min', desc: 'Short focused session' },
    { value: 45, label: '45 min', desc: 'Standard study session' },
    { value: 60, label: '1 hour', desc: 'Deep learning block' },
    { value: 90, label: '90 min', desc: 'Extended study session' },
    { value: 120, label: '2 hours', desc: 'Intensive study mode' },
];

const TOTAL_STEPS = 5;

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ current, total }) => (
    <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${(current / total) * 100}%` }}
            />
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">{current} / {total}</span>
    </div>
);

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

const StepWelcome = ({ onNext, name }) => (
    <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome, {name?.split(' ')[0]}! 👋</h2>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
            Let's set up your learning profile in a few quick steps so we can personalise your experience.
        </p>
        <button onClick={onNext} className="btn-primary">Get Started</button>
    </div>
);

// ─── Step 2: Course Selection ─────────────────────────────────────────────────

const StepCourse = ({ value, onChange, onNext, onBack }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['onboarding-courses'],
        queryFn: () => getCourses({ limit: 20 }).then((r) => r.data?.data || []),
    });

    return (
        <div>
            <h2 className="text-xl font-bold text-white mb-1">Which course are you studying?</h2>
            <p className="text-slate-400 text-sm mb-6">Select your enrolled programme</p>

            {isLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
            ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(data || []).map((course) => (
                        <button
                            key={course._id}
                            onClick={() => onChange(course._id)}
                            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${value === course._id
                                    ? 'bg-violet-600/20 border-violet-500/60 text-white'
                                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                                }`}
                        >
                            <BookOpen className={`w-4 h-4 flex-shrink-0 ${value === course._id ? 'text-violet-400' : 'text-slate-500'}`} />
                            <div className="min-w-0">
                                <p className="font-medium truncate text-sm">{course.title}</p>
                                <p className="text-xs text-slate-500">{course.category}</p>
                            </div>
                            {value === course._id && <Check className="w-4 h-4 text-violet-400 ml-auto flex-shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
            <StepNav onBack={onBack} onNext={onNext} canSkip />
        </div>
    );
};

// ─── Step 3: Subject Selection ────────────────────────────────────────────────

const StepSubjects = ({ courseId, value, onChange, onNext, onBack }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['onboarding-subjects', courseId],
        queryFn: () => courseId ? getSubjects({ courseId }).then((r) => r.data?.data || []) : Promise.resolve([]),
        enabled: !!courseId,
    });

    const toggle = (id) => {
        onChange(value.includes(id) ? value.filter((s) => s !== id) : [...value, id]);
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-white mb-1">Select your subjects</h2>
            <p className="text-slate-400 text-sm mb-6">{courseId ? 'Choose all the subjects you are studying' : 'Select a course first to see subjects'}</p>

            {!courseId && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400 mb-4">
                    No course selected. You can still proceed and add subjects later from your profile.
                </div>
            )}

            {isLoading && <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />)}</div>}

            {!isLoading && data && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {data.map((sub) => {
                        const selected = value.includes(sub._id);
                        return (
                            <button
                                key={sub._id}
                                onClick={() => toggle(sub._id)}
                                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selected ? 'bg-violet-600/20 border-violet-500/60 text-white' : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-violet-600 border-violet-500' : 'border-slate-600'}`}>
                                    {selected && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="text-sm font-medium">{sub.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}
            <StepNav onBack={onBack} onNext={onNext} canSkip />
        </div>
    );
};

// ─── Step 4: Learning Goal ────────────────────────────────────────────────────

const StepGoal = ({ value, onChange, onNext, onBack }) => (
    <div>
        <h2 className="text-xl font-bold text-white mb-1">What's your learning goal?</h2>
        <p className="text-slate-400 text-sm mb-6">This helps us tailor your experience</p>
        <div className="space-y-2">
            {GOALS.map((g) => (
                <button
                    key={g.value}
                    onClick={() => onChange(g.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${value === g.value ? 'bg-violet-600/20 border-violet-500/60' : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                        }`}
                >
                    <p className="font-medium text-white text-sm">{g.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{g.desc}</p>
                </button>
            ))}
        </div>
        <StepNav onBack={onBack} onNext={onNext} canSkip />
    </div>
);

// ─── Step 5: Daily Study Time ─────────────────────────────────────────────────

const StepStudyTime = ({ value, onChange, onNext, onBack, isLoading }) => (
    <div>
        <h2 className="text-xl font-bold text-white mb-1">How much time can you study daily?</h2>
        <p className="text-slate-400 text-sm mb-6">We'll set your daily study target accordingly</p>
        <div className="grid grid-cols-2 gap-2">
            {STUDY_TIMES.map((t) => (
                <button
                    key={t.value}
                    onClick={() => onChange(t.value)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${value === t.value ? 'bg-violet-600/20 border-violet-500/60' : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                        }`}
                >
                    <p className="font-semibold text-white text-sm">{t.label}</p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                </button>
            ))}
        </div>
        <div className="mt-6 flex gap-3">
            <button onClick={onBack} className="btn-ghost flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <button onClick={onNext} disabled={isLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <>Finish Setup <Check className="w-4 h-4" /></>}
            </button>
        </div>
    </div>
);

// ─── Nav buttons helper ────────────────────────────────────────────────────────

const StepNav = ({ onBack, onNext, canSkip }) => (
    <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
        {canSkip && (
            <button onClick={onNext} className="text-slate-500 text-sm hover:text-slate-300 px-3 transition-colors">Skip</button>
        )}
        <button onClick={onNext} className="btn-primary flex items-center gap-1 ml-auto">
            Continue <ChevronRight className="w-4 h-4" />
        </button>
    </div>
);

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

const OnboardingPage = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [courseId, setCourseId] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [learningGoal, setLearningGoal] = useState('');
    const [dailyStudyTime, setDailyStudyTime] = useState(null);
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: completeOnboarding,
        onSuccess: async () => {
            await refreshUser();
            navigate('/student/dashboard');
        },
        onError: (err) => setError(err?.response?.data?.error || 'Something went wrong. Please try again.'),
    });

    const handleFinish = () => {
        setError('');
        mutation.mutate({
            courseId: courseId || null,
            subjects: subjects.length ? subjects : undefined,
            learningGoal: learningGoal || null,
            dailyStudyTime: dailyStudyTime || null,
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-400 mb-4">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Profile Setup
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-xl">
                    <ProgressBar current={step} total={TOTAL_STEPS} />

                    {error && (
                        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
                    )}

                    {step === 1 && <StepWelcome onNext={() => setStep(2)} name={user?.name} />}
                    {step === 2 && <StepCourse value={courseId} onChange={setCourseId} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
                    {step === 3 && <StepSubjects courseId={courseId} value={subjects} onChange={setSubjects} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
                    {step === 4 && <StepGoal value={learningGoal} onChange={setLearningGoal} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
                    {step === 5 && <StepStudyTime value={dailyStudyTime} onChange={setDailyStudyTime} onNext={handleFinish} onBack={() => setStep(4)} isLoading={mutation.isPending} />}
                </div>

                {/* Skip all */}
                {step > 1 && (
                    <p className="text-center mt-4 text-xs text-slate-600">
                        <button onClick={handleFinish} className="hover:text-slate-400 transition-colors">Skip setup — go to dashboard →</button>
                    </p>
                )}
            </div>

            {/* Utility styles via style tag */}
            <style>{`
                .btn-primary { @apply bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors; }
                .btn-ghost { @apply bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors; }
            `}</style>
        </div>
    );
};

export default OnboardingPage;
