/**
 * Spinner — animated loading indicator.
 * Use for async loading states (API calls, route transitions).
 *
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - extra Tailwind classes
 */
const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
};

const Spinner = ({ size = 'md', className = '' }) => {
    return (
        <div
            role="status"
            aria-label="Loading"
            className={`
        inline-block rounded-full border-primary-500 border-t-transparent animate-spin
        ${sizeMap[size]} ${className}
      `}
        />
    );
};

export default Spinner;
