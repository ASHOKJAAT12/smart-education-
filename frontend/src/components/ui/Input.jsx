import { forwardRef } from 'react';

/**
 * Input — form input with floating label style and error state.
 *
 * @param {string} label
 * @param {string} error - validation error message
 * @param {string} hint - helper text below the input
 */
const Input = forwardRef(({ label, error, hint, className = '', ...props }, ref) => {
    const id = props.id || props.name;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-slate-300">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={id}
                aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                aria-invalid={!!error}
                className={`
          w-full rounded-xl border px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition
          bg-[#1a1a2e]
          ${error
                        ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                        : 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }
        `}
                {...props}
            />
            {error && (
                <p id={`${id}-error`} className="text-xs text-red-400">
                    {error}
                </p>
            )}
            {hint && !error && (
                <p id={`${id}-hint`} className="text-xs text-slate-500">
                    {hint}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
