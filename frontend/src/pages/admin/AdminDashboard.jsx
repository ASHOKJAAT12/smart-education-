import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { Database, Activity, BrainCircuit, Users, BookOpen, Target, FileQuestion, Mail, Cloud, Cpu } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform duration-500`}></div>
        <div className="relative z-10 flex items-center justify-between">
            <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">{title}</p>
                <h3 className="text-3xl font-black text-white">{value}</h3>
            </div>
            <div className={`p-4 rounded-xl bg-slate-800/50 border border-slate-700`}>
                <Icon className={`w-8 h-8 ${colorClass.split(' ')[1].replace('to-', 'text-')}`} />
            </div>
        </div>
    </div>
);

const HealthBadge = ({ label, status, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center text-slate-300 font-bold text-sm">
            <Icon className="w-5 h-5 mr-3 text-slate-500" />
            {label}
        </div>
        <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${status === 'healthy' || status === 'configured'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
            {status}
        </div>
    </div>
);

const AdminDashboard = () => {
    const { data: metricsData, isLoading: metricsLoading } = useQuery({
        queryKey: ['admin-metrics'],
        queryFn: adminService.getPlatformMetrics
    });

    const { data: healthData, isLoading: healthLoading } = useQuery({
        queryKey: ['admin-health'],
        queryFn: adminService.getPlatformHealth
    });

    if (metricsLoading || healthLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

    const metrics = metricsData?.data?.data || {};
    const health = healthData?.data?.data || {};

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
                    Platform Overview
                </h1>
                <p className="text-slate-400 font-medium mt-1">Live telemetry monitoring for SmartLearn AI infrastructure.</p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Students" value={metrics.students || 0} icon={Users} colorClass="from-blue-600 to-blue-400" />
                <MetricCard title="Active Teachers" value={metrics.teachers || 0} icon={Activity} colorClass="from-emerald-600 to-emerald-400" />
                <MetricCard title="System Courses" value={metrics.courses || 0} icon={BookOpen} colorClass="from-amber-600 to-amber-400" />
                <MetricCard title="AI Operations" value={metrics.aiRequests || 0} icon={BrainCircuit} colorClass="from-violet-600 to-violet-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Content Distribution */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4">Content Topology</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
                            <BookOpen className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                            <p className="text-3xl font-black text-white mb-1">{metrics.subjects || 0}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subjects</p>
                        </div>
                        <div className="text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
                            <FileQuestion className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                            <p className="text-3xl font-black text-white mb-1">{metrics.topics || 0}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Topics</p>
                        </div>
                        <div className="text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
                            <Target className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                            <p className="text-3xl font-black text-white mb-1">{metrics.quizzes || 0}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quizzes</p>
                        </div>
                    </div>
                </div>

                {/* Platform Health Monitoring */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-rose-500" /> System Health
                    </h2>

                    <div className="space-y-3">
                        <HealthBadge label="Backend API" status={health.api || "offline"} icon={Cpu} />
                        <HealthBadge label="MongoDB Cluster" status={health.database || "offline"} icon={Database} />
                        <HealthBadge label="Gemini AI Provider" status={health.ai || "offline"} icon={BrainCircuit} />
                        <HealthBadge label="Cloudinary Storage" status={health.cloudinary || "offline"} icon={Cloud} />
                        <HealthBadge label="SMTP Messaging" status={health.email || "offline"} icon={Mail} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
