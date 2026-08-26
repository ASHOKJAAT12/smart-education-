import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
];

/**
 * BaseLayout — wraps all public pages with a consistent top navbar and footer.
 * Protected pages (student/teacher/admin) will use their own role-specific layouts.
 */
const BaseLayout = ({ children }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="flex min-h-screen flex-col bg-[#0f0f1a] text-slate-200">
            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-primary-900/40 bg-[#0f0f1a]/80 backdrop-blur-md">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-400">
                        <BookOpen className="h-6 w-6" />
                        SmartLearn AI
                    </Link>

                    {/* Desktop nav */}
                    <ul className="hidden items-center gap-6 text-sm font-medium text-slate-400 md:flex">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    className="transition hover:text-primary-300"
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>

                    {/* CTA buttons */}
                    <div className="hidden items-center gap-3 md:flex">
                        <Link
                            to="/login"
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-primary-300"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-500"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        className="text-slate-400 transition hover:text-primary-300 md:hidden"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </nav>

                {/* Mobile nav */}
                {menuOpen && (
                    <div className="border-t border-primary-900/40 bg-[#0f0f1a] px-4 py-4 md:hidden">
                        <ul className="flex flex-col gap-3 text-sm font-medium text-slate-400">
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <a href={link.href} className="block transition hover:text-primary-300">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex flex-col gap-2">
                            <Link
                                to="/login"
                                className="w-full rounded-lg border border-primary-700 px-4 py-2 text-center text-sm text-slate-300 transition hover:bg-primary-900/30"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="w-full rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-primary-500"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* ── Main content ───────────────────────────────────────────── */}
            <main className="flex-1">{children}</main>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="border-t border-primary-900/30 py-6 text-center text-xs text-slate-500">
                <p>© {new Date().getFullYear()} SmartLearn AI. Built for learning excellence.</p>
            </footer>
        </div>
    );
};

export default BaseLayout;
