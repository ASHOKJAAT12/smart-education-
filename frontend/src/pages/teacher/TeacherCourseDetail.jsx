import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, LayoutDashboard, BookOpen, Layers,
    FileText, HelpCircle, FileSignature, BarChart2
} from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import Spinner from '../../components/ui/Spinner';
import StudyMaterialsTab from './tabs/StudyMaterialsTab';

const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'topics', label: 'Topics', icon: Layers },
    { id: 'materials', label: 'Study Materials', icon: FileText },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'quizzes', label: 'Quizzes', icon: FileSignature },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const TeacherCourseDetail = () => {
    const { id: courseId } = useParams();
    const [activeTab, setActiveTab] = useState('materials'); // default to materials for this feature focus

    const { data: course, isLoading, isError } = useQuery({
        queryKey: ['teacher-course', courseId],
        queryFn: () => teacherService.getTeacherCourseById(courseId).then(r => r.data.data),
    });

    if (isLoading) return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;
    if (isError) return (
        <div className="p-10 flex flex-col items-center">
            <p className="text-red-400 font-bold text-xl mb-2">Error Loading Course</p>
            <p className="text-slate-400">The course may not exist or you lack permission to view it.</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
            <Link to="/teacher/courses" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Back to My Courses
            </Link>

            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
                {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-32 h-32 rounded-2xl object-cover shadow-sm bg-slate-100" />
                ) : (
                    <div className="w-32 h-32 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-10 h-10 text-indigo-300" />
                    </div>
                )}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{course.category}</span>
                        {course.isPublished ? (
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Published</span>
                        ) : (
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Draft</span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">{course.title}</h1>
                    <p className="text-slate-500 mb-4 max-w-3xl leading-relaxed">{course.description || 'No description provided.'}</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px mb-8 scrollbar-hide">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${isActive
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[500px]">
                {activeTab === 'materials' && <StudyMaterialsTab courseId={courseId} />}

                {activeTab !== 'materials' && (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                            <Layers className="w-8 h-8 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <p className="text-slate-500 max-w-sm mb-6">This section is currently under construction and will be integrated into the course dashboard shortly.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherCourseDetail;
