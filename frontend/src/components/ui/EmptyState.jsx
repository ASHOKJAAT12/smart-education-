import React from 'react';
import { BookOpen } from 'lucide-react';

const EmptyState = ({ icon: Icon = BookOpen, title = 'Nothing here yet', message = '', action }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-1">{title}</h3>
        {message && <p className="text-slate-400 text-sm max-w-xs">{message}</p>}
        {action && <div className="mt-5">{action}</div>}
    </div>
);

export default EmptyState;
