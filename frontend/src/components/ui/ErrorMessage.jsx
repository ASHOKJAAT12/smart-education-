import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorMessage — displays a styled error with an optional retry button.
 *
 * @param {string} message - Error text to display
 * @param {function} onRetry - Optional retry callback
 * @param {string} className - Additional Tailwind classes
 */
const ErrorMessage = ({ message = 'Something went wrong.', onRetry, className = '' }) => {
    return (
        <div
            role="alert"
            className={`
        flex flex-col items-center gap-3 rounded-xl border border-red-500/30
        bg-red-500/10 px-6 py-5 text-center text-red-400
        ${className}
      `}
        >
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            <p className="text-sm font-medium">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="
            mt-1 flex items-center gap-2 rounded-lg border border-red-400/40
            px-4 py-1.5 text-xs font-medium text-red-300
            transition hover:bg-red-500/20 focus-visible:ring-2 focus-visible:ring-red-400
          "
                >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Try again
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
