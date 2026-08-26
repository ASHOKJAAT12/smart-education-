import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    FileText,
    ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const navItems = [
        { name: 'Platform Overview', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'Content Moderation', path: '/admin/moderation', icon: BookOpen },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
        { name: 'System Settings', path: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-900 flex text-slate-300">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-800">
                <div className="p-6 flex items-center justify-center border-b border-slate-800">
                    <ShieldAlert className="w-6 h-6 text-rose-500 mr-2" />
                    <span className="text-xl font-black text-white tracking-widest uppercase">SmartLearn <span className="text-rose-500">Admin</span></span>
                </div>
                <div className="flex-1 overflow-y-auto py-6">
                    <nav className="space-y-1 px-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center px-4 py-3 rounded-xl transition-colors ${isActive
                                            ? 'bg-rose-600/10 text-rose-500 shadow-sm border border-rose-600/20'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                        }`
                                    }
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    <span className="font-semibold text-sm">{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-semibold text-red-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                    >
                        <LogOut className="w-5 h-5 mr-3" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0A0A0F]">
                {/* Mobile Topbar */}
                <div className="lg:hidden bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <span className="text-lg font-black text-white uppercase flex items-center tracking-wider">
                        <ShieldAlert className="w-5 h-5 text-rose-500 mr-2" /> SmartLearn <span className="text-rose-500 ml-1">Admin</span>
                    </span>
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative flex flex-col w-64 max-w-xs bg-slate-950 h-full border-r border-slate-800 shadow-2xl">
                        <div className="p-4 flex items-center justify-between border-b border-slate-800">
                            <span className="text-lg font-black text-white uppercase tracking-wider flex items-center">
                                <ShieldAlert className="w-5 h-5 text-rose-500 mr-2" /> Admin
                            </span>
                            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 py-4 overflow-y-auto">
                            <nav className="space-y-1 px-4">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center px-4 py-3 rounded-xl transition-colors ${isActive
                                                    ? 'bg-rose-600/10 text-rose-500 shadow-sm border border-rose-600/20'
                                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                                }`
                                            }
                                        >
                                            <Icon className="w-5 h-5 mr-3" />
                                            <span className="font-semibold text-sm">{item.name}</span>
                                        </NavLink>
                                    );
                                })}
                            </nav>
                        </div>
                        <div className="p-4 border-t border-slate-800">
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-4 py-3 text-sm font-semibold text-red-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                            >
                                <LogOut className="w-5 h-5 mr-3" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
