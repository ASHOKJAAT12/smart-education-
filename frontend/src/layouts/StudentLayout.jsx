import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, ClipboardList, User2,
    LogOut, Menu, X, ChevronRight, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Courses', href: '/courses', icon: BookOpen },
    { label: 'Quizzes', href: '/quizzes', icon: ClipboardList },
    { label: 'Profile', href: '/student/profile', icon: User2 },
];

const StudentLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

    const NavItem = ({ item, onClick }) => (
        <Link
            to={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.href)
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
        >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
        </Link>
    );

    const Sidebar = ({ mobile = false }) => (
        <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-5'}`}>
            {/* Logo */}
            <Link to="/student/dashboard" className="flex items-center gap-2.5 mb-8">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-sm">SmartLearn AI</span>
            </Link>

            {/* Nav */}
            <nav className="flex flex-col gap-1 flex-1">
                {NAV.map((item) => (
                    <NavItem key={item.href} item={item} onClick={mobile ? () => setSidebarOpen(false) : undefined} />
                ))}
            </nav>

            {/* User info + logout */}
            <div className="border-t border-slate-700/60 pt-4 mt-4">
                <div className="flex items-center gap-3 mb-3">
                    {user?.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                            <span className="text-violet-300 text-xs font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col w-60 bg-slate-900 border-r border-slate-800 flex-shrink-0">
                <Sidebar />
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <div className="relative w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                        <button
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <Sidebar mobile />
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                {/* Mobile topbar */}
                <header className="lg:hidden sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
                        <Menu className="w-5 h-5" />
                    </button>
                    <Link to="/student/dashboard" className="font-bold text-white text-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-violet-400" />
                        SmartLearn AI
                    </Link>
                    <Link to="/student/profile">
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                                <span className="text-violet-300 text-xs font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
                            </div>
                        )}
                    </Link>
                </header>

                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
};

export default StudentLayout;
