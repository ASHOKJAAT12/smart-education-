import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../services/authService';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {
        setServerError('');
        if (!token) {
            setServerError('Reset token is missing. Please use the link from your email.');
            return;
        }
        try {
            await resetPassword({ token, password: data.password });
            setSuccess(true);
        } catch (err) {
            setServerError(err.userMessage || 'Invalid or expired reset link. Please request a new one.');
        }
    };

    if (!token) {
        return (
            <AuthLayout title="Invalid Link">
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <ErrorMessage message="This reset link is invalid. Please request a new password reset." />
                    <Link to="/forgot-password" className="mt-2 text-sm text-indigo-400 hover:text-indigo-300">
                        Request a new link
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    if (success) {
        return (
            <AuthLayout title="Password updated!">
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle className="h-7 w-7 text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-300">
                        Your password has been updated. You can now sign in with your new password.
                    </p>
                    <Link
                        to="/login"
                        className="mt-2 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                        Sign In
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="Enter a new password for your account"
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                {serverError && <ErrorMessage message={serverError} />}

                <div className="relative">
                    <Input
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        error={errors.password?.message}
                        hint="At least 8 characters, one uppercase letter, one number"
                        {...register('password', {
                            required: 'Password is required',
                            minLength: { value: 8, message: 'At least 8 characters' },
                            validate: {
                                uppercase: (v) => /[A-Z]/.test(v) || 'Needs one uppercase letter',
                                number: (v) => /[0-9]/.test(v) || 'Needs one number',
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
                    Update Password
                </Button>
            </form>
        </AuthLayout>
    );
};

export default ResetPasswordPage;
