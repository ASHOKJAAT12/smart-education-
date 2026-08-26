import React from 'react';

const VARIANTS = {
    default: 'bg-slate-700 text-slate-200',
    primary: 'bg-violet-600/20 text-violet-300 border border-violet-500/30',
    success: 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-600/20 text-amber-300 border border-amber-500/30',
    danger: 'bg-red-600/20 text-red-300 border border-red-500/30',
    info: 'bg-sky-600/20 text-sky-300 border border-sky-500/30',
};

const DIFFICULTY = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger',
    mixed: 'info',
};

const LEVEL = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger',
};

/**
 * Badge component.
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'} variant
 * @param {'difficulty'|'level'|undefined} mapFrom — auto-map a content value to a variant
 */
const Badge = ({ children, variant, mapFrom, className = '' }) => {
    let resolvedVariant = variant || 'default';
    if (mapFrom === 'difficulty') resolvedVariant = DIFFICULTY[children] || 'default';
    if (mapFrom === 'level') resolvedVariant = LEVEL[children] || 'default';

    const cls = VARIANTS[resolvedVariant] || VARIANTS.default;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
