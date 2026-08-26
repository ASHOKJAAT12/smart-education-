import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Sparkles,
    Settings,
    LogOut,
    Menu,
    X,
    FileQuestion
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TeacherLayout = () => {
    const { user, logout } = useAuth();
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
        { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'My Courses', path: '/teacher/courses', icon: BookOpen },
        { name: 'Question Bank', path: '/teacher/questions', icon: FileQuestion },
        { name: 'Students & Analytics', path: '/teacher/students', icon: Users },
        { name: 'AI Assistant', path: '/teacher/ai-assistant', icon: Sparkles },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300">
                <div className="p-6 flex items-center justify-center border-b border-slate-800">
                    <span className="text-xl font-bold text-white tracking-widest uppercase">SmartLearn <span className="text-violet-500">Teacher</span></span>
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
                                            ? 'bg-violet-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                        className="flex items-center w-full px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-xl transition"
                    >
                        <LogOut className="w-5 h-5 mr-3" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Topbar */}
                <div className="lg:hidden bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <span className="text-lg font-bold text-white uppercase flex items-center tracking-wider">
                        SmartLearn <span className="text-violet-500 ml-1">Teacher</span>
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
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative flex flex-col w-64 max-w-xs bg-slate-900 h-full border-r border-slate-800 shadow-2xl">
                        <div className="p-4 flex items-center justify-between border-b border-slate-800">
                            <span className="text-lg font-bold text-white uppercase tracking-wider">Teacher</span>
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
                                                    ? 'bg-violet-600 text-white shadow-md'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                                className="flex items-center w-full px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-xl transition"
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

export default TeacherLayout;
