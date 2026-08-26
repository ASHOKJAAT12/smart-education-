import React from 'react';
import { ShieldAlert, BookOpen, AlertCircle, FileQuestion, Users, Search } from 'lucide-react';

const SystemModeration = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white flex items-center">
                    <ShieldAlert className="w-8 h-8 mr-3 text-rose-500" /> Content Moderation
                </h1>
                <p className="text-slate-400 font-medium mt-1">Review flagged AI generated assets, courses, and platform abuse reports.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No Reports Pending</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                    The platform currently has zero flagged questions, topics, or courses requiring administrative overwrite. Moderation queues are completely clear!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                        <BookOpen className="w-5 h-5 text-slate-500 mb-2" />
                        <div className="text-xl font-black text-white">0</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Flagged Courses</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                        <FileQuestion className="w-5 h-5 text-slate-500 mb-2" />
                        <div className="text-xl font-black text-white">0</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Flagged Questions</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                        <Users className="w-5 h-5 text-slate-500 mb-2" />
                        <div className="text-xl font-black text-white">0</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">User Reports</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemModeration;
