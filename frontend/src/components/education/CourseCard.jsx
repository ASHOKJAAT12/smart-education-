import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, BarChart2 } from 'lucide-react';
import Badge from '../ui/Badge';

const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const LEVEL_COLOR = { beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444' };
const DEFAULT_THUMB = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=60';

const CourseCard = ({ course }) => {
    const { _id, title, description, thumbnail, category, level, isPublished } = course;

    return (
        <Link
            to={`/courses/${_id}`}
            className="group block bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden 
                       hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 
                       transition-all duration-200"
        >
            {/* Thumbnail */}
            <div className="relative h-40 bg-slate-700 overflow-hidden">
                <img
                    src={thumbnail || DEFAULT_THUMB}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = DEFAULT_THUMB; }}
                />
                {!isPublished && (
                    <span className="absolute top-2 right-2 bg-slate-900/80 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30">
                        Draft
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary">{category}</Badge>
                    <Badge mapFrom="level">{level}</Badge>
                </div>
                <h3 className="font-semibold text-white leading-snug mb-1 group-hover:text-violet-300 transition-colors line-clamp-2">
                    {title}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-2">{description}</p>
            </div>
        </Link>
    );
};

export default CourseCard;
