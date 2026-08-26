import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Redirect to the page the user was trying to visit, or to their dashboard
    const from = location.state?.from || null;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {
        setServerError('');
        try {
            const user = await login(data.email, data.password);
            // Redirect based on role
            const roleRedirects = {
                student: '/student/dashboard',
                teacher: '/teacher/dashboard',
                admin: '/admin/dashboard',
            };
            navigate(from || roleRedirects[user.role] || '/', { replace: true });
        } catch (err) {
            setServerError(err.userMessage || 'Login failed. Please try again.');
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to your SmartLearn account">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                {serverError && <ErrorMessage message={serverError} />}

                <Input
                    label="Email"
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                    })}
                />

                <div className="relative">
                    <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        error={errors.password?.message}
                        {...register('password', { required: 'Password is required' })}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-200"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                <div className="flex justify-end">
                    <Link
                        to="/forgot-password"
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                    >
                        Forgot password?
                    </Link>
                </div>

                <Button type="submit" fullWidth loading={isSubmitting}>
                    Sign In
                </Button>

                <p className="text-center text-sm text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition">
                        Create one free
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default LoginPage;
