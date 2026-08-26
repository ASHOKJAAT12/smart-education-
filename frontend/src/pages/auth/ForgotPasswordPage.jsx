import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { forgotPassword } from '../../services/authService';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';

const ForgotPasswordPage = () => {
    const [sent, setSent] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {
        setServerError('');
        try {
            await forgotPassword(data.email);
            setSent(true);
        } catch {
            // Generic error — server intentionally doesn't reveal if email exists
            setServerError('Something went wrong. Please try again.');
        }
    };

    if (sent) {
        return (
            <AuthLayout title="Check your email">
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle className="h-7 w-7 text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-300">
                        If an account with that email exists, a password reset link has been sent.
                        Check your inbox — the link expires in <strong>10 minutes</strong>.
                    </p>
                    <Link to="/login" className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition">
                        Back to sign in
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot your password?"
            subtitle="Enter your email and we'll send you a reset link"
        >
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

                <Button type="submit" fullWidth loading={isSubmitting}>
                    Send Reset Link
                </Button>

                <Link
                    to="/login"
                    className="text-center text-sm text-slate-400 hover:text-slate-300 transition"
                >
                    ← Back to sign in
                </Link>
            </form>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
