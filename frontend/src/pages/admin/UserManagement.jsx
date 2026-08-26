import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { Users, Search, ShieldCheck, UserX, Loader2, Edit2 } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const UserManagement = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin-users'],
        queryFn: adminService.getPlatformUsers
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, isActive }) => adminService.updateUserStatus(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
        }
    });

    const roleMutation = useMutation({
        mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
        }
    });

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
    if (isError) return <ErrorMessage message={error?.response?.data?.error || 'Failed to fetch platform users'} />;

    let users = data?.data?.data || [];

    // Filtering
    if (filterRole !== 'all') {
        users = users.filter(u => u.role === filterRole);
    }
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        users = users.filter(u => u.name.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower));
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white flex items-center">
                    <Users className="w-8 h-8 mr-3 text-blue-500" /> Platform User Manager
                </h1>
                <p className="text-slate-400 font-medium mt-1">Audit, authorize, and moderate registered identities globally.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>

                    <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto">
                        {['all', 'student', 'teacher', 'admin'].map(role => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${filterRole === role ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold border-b border-slate-800">Identity</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-800">Role Authority</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-800 text-center">Status</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Moderation Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold flex-shrink-0 border border-slate-700">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white tracking-wide">{user.name}</div>
                                                <div className="text-slate-400 text-xs">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => roleMutation.mutate({ id: user._id, role: e.target.value })}
                                            disabled={roleMutation.isLoading}
                                            className={`bg-slate-950 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg appearance-none cursor-pointer outline-none uppercase tracking-wider ${user.role === 'admin' ? 'text-rose-500 border-rose-900/50' :
                                                    user.role === 'teacher' ? 'text-emerald-500 border-emerald-900/50' :
                                                        'text-blue-500 border-blue-900/50'
                                                }`}
                                        >
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border ${user.isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {user.isActive ? (
                                            <button
                                                onClick={() => statusMutation.mutate({ id: user._id, isActive: false })}
                                                disabled={statusMutation.isLoading}
                                                className="inline-flex items-center px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl font-bold text-xs transition-colors"
                                            >
                                                <UserX className="w-4 h-4 mr-1.5" /> Suspend
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => statusMutation.mutate({ id: user._id, isActive: true })}
                                                disabled={statusMutation.isLoading}
                                                className="inline-flex items-center px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-xl font-bold text-xs transition-colors"
                                            >
                                                <ShieldCheck className="w-4 h-4 mr-1.5" /> Activate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                            <Users className="w-12 h-12 mb-4 opacity-50" />
                            <p className="font-bold">No users found matching parameters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
