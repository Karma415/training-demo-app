
import React from 'react';
import { IssueCategory } from '../types';
import { Filter, Calendar, AlertTriangle } from 'lucide-react';

interface TimelineFilterProps {
    categories: IssueCategory[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    showOnlyNeglected: boolean;
    onToggleNeglected: (show: boolean) => void;
}

const TimelineFilter: React.FC<TimelineFilterProps> = ({
    categories,
    selectedCategory,
    onCategoryChange,
    showOnlyNeglected,
    onToggleNeglected
}) => {
    return (
        <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2 text-slate-500">
                    <Filter size={18} />
                    <span className="text-sm font-semibold uppercase tracking-wider">Filter Timeline</span>
                </div>

                <div className="flex items-center space-x-2">
                    <label htmlFor="category-filter" className="text-xs text-slate-400 font-bold uppercase">Category:</label>
                    <select
                        id="category-filter"
                        value={selectedCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button
                    onClick={() => onToggleNeglected(!showOnlyNeglected)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${showOnlyNeglected
                            ? 'bg-red-50 text-red-700 border-red-200 shadow-sm ring-1 ring-red-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    <AlertTriangle size={16} className={showOnlyNeglected ? 'text-red-500' : 'text-slate-400'} />
                    <span>Show Only Neglected Issues</span>
                </button>

                <div className="hidden md:flex items-center space-x-2 text-slate-400 border-l pl-4 ml-4">
                    <Calendar size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Auto-sorted by date</span>
                </div>
            </div>
        </div>
    );
};

export default TimelineFilter;
