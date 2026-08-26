import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { FileText, Search, Clock, ShieldAlert } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const AuditLogs = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin-audit-logs'],
        queryFn: adminService.getAuditLogs
    });

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
    if (isError) return <ErrorMessage message={error?.response?.data?.error || 'Failed to fetch audit trails'} />;

    let logs = data?.data?.data || [];

    // Filtering
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        logs = logs.filter(l =>
            l.action.toLowerCase().includes(lower) ||
            (l.actorId?.name && l.actorId.name.toLowerCase().includes(lower)) ||
            (l.actorId?.email && l.actorId.email.toLowerCase().includes(lower))
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white flex items-center">
                    <FileText className="w-8 h-8 mr-3 text-amber-500" /> Platform Audit Trail
                </h1>
                <p className="text-slate-400 font-medium mt-1">Irrefutable logging of privileged operations and state mutations.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="relative w-full sm:w-96">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by action or actor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold border-b border-slate-800">Timestamp</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-800">Operation / Action</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-800">Actor Identity</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-800">Target Entity</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-800">IP Origin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-400 flex items-center whitespace-nowrap">
                                        <Clock className="w-4 h-4 mr-2 opacity-50" />
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border ${log.action.includes('DEACTIVATED') || log.action.includes('SUSPEND')
                                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                : log.action.includes('ROLE_CHANGED')
                                                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            <ShieldAlert className="w-3 h-3 mr-1.5 opacity-70" />
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        {log.actorId ? (
                                            <div>
                                                <div className="font-bold text-white tracking-wide">{log.actorId.name}</div>
                                                <div className="text-slate-400 text-xs uppercase tracking-widest">{log.actorId.role}</div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-500 italic">System / Deleted User</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-300">{log.entityType}</div>
                                        <div className="text-slate-500 text-[10px] font-mono">{log.entityId}</div>
                                    </td>

                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                        {log.ipAddress || 'Unknown / Local'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {logs.length === 0 && (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                            <FileText className="w-12 h-12 mb-4 opacity-50" />
                            <p className="font-bold">No audit trails exist yet.</p>
                            <p className="text-sm mt-1">Actions performed by privileged users will populate here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
