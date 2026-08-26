import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register: authRegister } = useAuth();
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {
        setServerError('');
        try {
            await authRegister(data.name, data.email, data.password);
            // All self-registered users are students
            navigate('/student/dashboard', { replace: true });
        } catch (err) {
            setServerError(err.userMessage || 'Registration failed. Please try again.');
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Start your AI-powered learning journey for free"
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                {serverError && <ErrorMessage message={serverError} />}

                <Input
                    label="Full Name"
                    type="text"
                    id="name"
                    placeholder="Jane Smith"
                    autoComplete="name"
                    error={errors.name?.message}
                    {...register('name', {
                        required: 'Name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    })}
                />

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
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        error={errors.password?.message}
                        hint="At least 8 characters, one uppercase letter, one number"
                        {...register('password', {
                            required: 'Password is required',
                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                            validate: {
                                uppercase: (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
                                number: (v) => /[0-9]/.test(v) || 'Must contain a number',
                            },
                        })}
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

                <Button type="submit" fullWidth loading={isSubmitting}>
                    Create Free Account
                </Button>

                <p className="text-center text-xs text-slate-500">
                    By signing up you agree to our{' '}
                    <span className="text-indigo-400">Terms of Service</span> and{' '}
                    <span className="text-indigo-400">Privacy Policy</span>.
                </p>

                <p className="text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition">
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default RegisterPage;
