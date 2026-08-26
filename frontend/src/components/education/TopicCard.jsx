import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';

const TopicCard = ({ topic }) => {
    const { _id, name, difficulty, estimatedMinutes, isPublished } = topic;
    return (
        <Link
            to={`/topics/${_id}`}
            className="group flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-xl p-4
                       hover:border-violet-500/50 hover:bg-slate-800 transition-all duration-150"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-100 truncate group-hover:text-violet-300 transition-colors">{name}</p>
                        <Badge mapFrom="difficulty">{difficulty}</Badge>
                        {!isPublished && (
                            <span className="text-xs text-yellow-500 border border-yellow-500/30 rounded px-1.5 py-0.5">Draft</span>
                        )}
                    </div>
                    {estimatedMinutes && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{estimatedMinutes} min</span>
                        </div>
                    )}
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 flex-shrink-0 ml-2 transition-colors" />
        </Link>
    );
};

export default TopicCard;
