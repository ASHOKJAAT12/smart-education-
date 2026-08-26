/**
 * Button — primary reusable button component.
 *
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} loading - shows spinner + disables interaction
 * @param {boolean} fullWidth
 */
import Spinner from './Spinner';

const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 focus-visible:ring-indigo-500',
    secondary: 'border border-indigo-700/50 text-slate-300 hover:border-indigo-500 hover:text-white',
    ghost: 'text-slate-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-600 text-white hover:bg-red-500',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className = '',
    type = 'button',
    ...props
}) => {
    return (
        <button
            type={type}
            disabled={loading || props.disabled}
            className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            {...props}
        >
            {loading && <Spinner size="sm" />}
            {children}
        </button>
    );
};

export default Button;
