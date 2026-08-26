import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { teacherService } from '../../services/teacherService';
import { Users, BookOpen, Calculator, Target, LayoutDashboard, TrendingDown, Bell } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-800">{value}</h3>
        </div>
        <div className={`p-4 rounded-xl ${color}`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
    </div>
);

const TeacherDashboard = () => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['teacher-dashboard'],
        queryFn: teacherService.getDashboardMetrics
    });

    if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
    if (isError) return <ErrorMessage message={error?.response?.data?.error || 'Failed to load teacher dashboard'} />;

    const { metrics, difficultTopics } = data.data.data;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
                    <LayoutDashboard className="w-8 h-8 mr-3 text-violet-600" /> Teacher Dashboard
                </h1>
                <p className="text-slate-500 font-medium mt-1">Here's what is happening across your classrooms today.</p>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="My Courses" value={metrics?.courses || 0} icon={BookOpen} color="bg-violet-600" />
                <StatCard title="Total Students" value={metrics?.students || 0} icon={Users} color="bg-blue-600" />
                <StatCard title="Active Quizzes" value={metrics?.activeQuizzes || 0} icon={Target} color="bg-emerald-500" />
                <StatCard title="Published Resources" value={metrics?.publishedResources || 0} icon={Calculator} color="bg-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Most Difficult Topics */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <TrendingDown className="w-5 h-5 mr-2 text-rose-500" /> Most Difficult Topics
                    </h2>
                    {difficultTopics && difficultTopics.length > 0 ? (
                        <div className="space-y-4">
                            {difficultTopics.map((topic, i) => (
                                <div key={topic.topicId} className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50 transition-colors">
                                    <div className="flex items-center">
                                        <div className="bg-rose-100 text-rose-700 font-black w-8 h-8 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{topic.title}</h3>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{topic.studentsCount} Students Assessed</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-2xl font-black text-rose-600">{topic.averageMastery}%</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Mastery</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                            <TrendingDown className="w-8 h-8 text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">Not enough historical data to compute class difficulty yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Assign some quizzes to your students to generate insights.</p>
                        </div>
                    )}
                </div>

                {/* Intelligent Insights Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
                    <h2 className="text-lg font-bold mb-6 flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-yellow-400" /> Actionable Insights
                    </h2>
                    <div className="space-y-4">
                        {difficultTopics && difficultTopics[0] ? (
                            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                                <p className="text-sm text-slate-300 font-medium mb-3">
                                    Your class is heavily struggling with <span className="text-white font-black px-1">{difficultTopics[0].title}</span> (Avg Mastery: {difficultTopics[0].averageMastery}%).
                                </p>
                                <button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                                    Generate Remedial Quiz
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                                <p className="text-sm text-slate-400 font-medium">Your class is performing exceptionally well! Keep it up!</p>
                            </div>
                        )}
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                            <p className="text-sm text-slate-300 font-medium mb-3">
                                You have <span className="font-bold text-white max-w-min">{metrics?.activeQuizzes}</span> active quizzes yielding realtime feedback. Want to draft more efficiently?
                            </p>
                            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                                Open AI Generator
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
