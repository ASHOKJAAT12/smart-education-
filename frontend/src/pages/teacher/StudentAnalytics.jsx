import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { teacherService } from '../../services/teacherService';
import { Users, Search, ChevronRight, Activity } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const StudentAnalytics = () => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['teacher-students'],
        queryFn: teacherService.getStudentAnalytics
    });

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
    if (isError) return <ErrorMessage message={error?.response?.data?.error || 'Failed to fetch student data'} />;

    const students = data?.data?.data?.students || [];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-800 flex items-center">
                    <Users className="w-8 h-8 mr-3 text-blue-600" /> Student Analytics
                </h1>
                <p className="text-slate-500 font-medium mt-1">Cross-reference individual student progression mappings globally.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="relative w-72">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">Student</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap">Overall Mastery</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap">Mastered Topics</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {students.map((student) => (
                                <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{student.name}</div>
                                                <div className="text-slate-500 text-xs">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-24 bg-slate-100 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${student.overallMastery < 50 ? 'bg-rose-500' : student.overallMastery < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.max(5, student.overallMastery)}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-slate-700">{student.overallMastery}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-slate-600 font-medium">
                                            <Activity className="w-4 h-4 mr-2 text-indigo-400" /> {student.topicsDone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {student.overallMastery < 50 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                Requires Sync
                                            </span>
                                        ) : student.overallMastery < 80 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                On Track
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                Excelling
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 font-bold flex items-center justify-end w-full group-hover:translate-x-1 transition-transform">
                                            Intervene <ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {students.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No students enrolled in your courses yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAnalytics;
