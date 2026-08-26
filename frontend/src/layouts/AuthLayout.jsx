import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * AuthLayout — minimal centered layout for all auth pages (login, register, etc.).
 *
 * @param {string} title - page heading
 * @param {string} subtitle - supporting text
 */
const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] px-4 py-12">
            {/* Ambient gradient */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center"
            >
                <div className="h-[600px] w-[600px] rounded-full bg-indigo-600/8 blur-[140px]" />
            </div>

            <div className="w-full max-w-md">
                {/* Logo */}
                <Link
                    to="/"
                    className="mb-8 flex items-center justify-center gap-2 text-lg font-bold text-indigo-400"
                >
                    <BookOpen className="h-6 w-6" />
                    SmartLearn AI
                </Link>

                {/* Card */}
                <div className="rounded-2xl border border-slate-800 bg-[#13131f] px-8 py-9 shadow-2xl">
                    {(title || subtitle) && (
                        <div className="mb-7 text-center">
                            {title && (
                                <h1 className="text-2xl font-bold text-white">{title}</h1>
                            )}
                            {subtitle && (
                                <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
                            )}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
