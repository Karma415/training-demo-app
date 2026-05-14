
import React, { useMemo, useState } from 'react';
import { Issue, InteractionLogEntry } from '../types';
import { MessageSquare, AlertCircle, TrendingUp, Info } from 'lucide-react';

interface EvidenceTimelineProps {
    issues: Issue[];
    interactions: InteractionLogEntry[];
    filterCategory?: string;
    showOnlyNeglected?: boolean;
    sortOrder?: 'asc' | 'desc';
}

type TimelineEvent = {
    id: string;
    date: Date;
    type: 'ISSUE' | 'INTERACTION';
    data: any;
    neglected?: boolean;
    gapDays?: number;
};

const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
    issues,
    interactions,
    filterCategory = 'All',
    showOnlyNeglected = false,
    sortOrder = 'asc'
}) => {
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

    const events = useMemo(() => {
        let combinedEvents: TimelineEvent[] = [];

        // Add Issues
        issues.forEach(issue => {
            combinedEvents.push({
                id: issue.id,
                date: new Date(issue.dateStarted),
                type: 'ISSUE',
                data: issue
            });
        });

        // Add Interactions
        interactions.forEach(log => {
            combinedEvents.push({
                id: log.id,
                date: log.timestamp ? new Date(log.timestamp) : new Date(),
                type: 'INTERACTION',
                data: log
            });
        });

        // Sort by date based on sortOrder
        combinedEvents.sort((a, b) => {
            const timeA = a.date.getTime();
            const timeB = b.date.getTime();
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });

        // Apply Filters
        if (filterCategory !== 'All') {
            combinedEvents = combinedEvents.filter(e => {
                if (e.type === 'ISSUE') {
                    const category = e.data.category;
                    return Array.isArray(category) ? category.includes(filterCategory) : category === filterCategory;
                }
                if (e.type === 'INTERACTION') {
                    const cat = e.data.interactionCategory;
                    return Array.isArray(cat) ? cat.includes(filterCategory) : cat === filterCategory;
                }
                return false;
            });
        }

        // Gap Analysis & Neglect Tagging (Comparing with previous event in ascending order)
        combinedEvents.forEach((event, index) => {
            if (index > 0) {
                const prevEvent = combinedEvents[index - 1];
                const gapMs = Math.abs(event.date.getTime() - prevEvent.date.getTime());
                event.gapDays = Math.floor(gapMs / (1000 * 60 * 60 * 24));

                if (event.gapDays > 14) {
                    event.neglected = true;
                }
            }
        });

        if (showOnlyNeglected) {
            combinedEvents = combinedEvents.filter(e => e.neglected || (e.type === 'ISSUE' && e.data.status === 'Stalled'));
        }

        return combinedEvents;
    }, [issues, interactions, filterCategory, showOnlyNeglected, sortOrder]);

    return (
        <div className="relative">
            {/* Timeline Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>

            <div className="space-y-12">
                {events.length === 0 ? (
                    <div className="ml-16 py-12 text-slate-400 italic">
                        No events found matching your current filters.
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={`${event.type}-${event.id}`} className="relative ml-8 pl-12">
                            {/* Event Marker */}
                            <div className={`absolute left-[-17px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 ${event.type === 'ISSUE' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'
                                }`}>
                                {event.type === 'ISSUE' ? <AlertCircle size={14} /> : <MessageSquare size={14} />}
                            </div>

                            {/* Gap Warning */}
                            {event.gapDays !== undefined && event.gapDays > 0 && (
                                <div className={`absolute left-[-40px] top-[-30px] flex flex-col items-center group`}>
                                    <div className={`w-0.5 h-6 ${event.neglected ? 'bg-red-400' : 'bg-slate-200'}`}></div>
                                    <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${event.neglected ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {event.gapDays}D {event.neglected ? 'SILENCE' : 'GAP'}
                                    </div>
                                </div>
                            )}

                            {/* Card Content */}
                            <div 
                                onClick={() => setSelectedEvent(event)}
                                className={`p-5 rounded-xl border-l-4 shadow-sm bg-white transition-all hover:shadow-md cursor-pointer ${event.neglected ? 'border-red-500 ring-1 ring-red-100' :
                                event.type === 'ISSUE' ? 'border-blue-500' : 'border-emerald-500'
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        {event.date.toLocaleDateString()}
                                    </span>
                                    {event.neglected && (
                                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-600 text-[10px] font-black text-white uppercase animate-pulse">
                                            <TrendingUp size={10} />
                                            <span>Documented Neglect</span>
                                        </span>
                                    )}
                                </div>

                                {event.type === 'ISSUE' ? (
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Issue Reported: {Array.isArray(event.data.category) ? event.data.category.join(', ') : event.data.category}
                                        </h3>
                                        <p className="text-slate-600 mt-1 line-clamp-3">{event.data.description}</p>
                                        <div className="mt-3 flex items-center space-x-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${event.data.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {event.data.status}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                Reported via {event.data.managementMethod}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Interaction: {event.data.interactionType}
                                        </h3>
                                        <p className="text-slate-600 mt-1 opacity-90">{event.data.summary}</p>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                                            <div className="flex items-center space-x-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                                                <span className="font-bold text-slate-500">Staff:</span>
                                                <span className="text-slate-700">{event.data.staffName}</span>
                                            </div>
                                            <div className="flex items-center space-x-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                                                <span className="font-bold text-slate-500">Topic:</span>
                                                <span className="text-slate-700">{Array.isArray(event.data.interactionCategory) ? event.data.interactionCategory.join(', ') : event.data.interactionCategory}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-12 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start space-x-3 text-sm text-blue-800">
                <Info size={18} className="mt-0.5 flex-shrink-0" />
                <p>
                    <strong>Advocacy Note:</strong> Red highlighting indicates "Gaps in Response" exceeding 14 days. This is a critical evidence point for "Intentional Negligence" under SF law.
                </p>
            </div>

            {/* Selected Event Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                    {selectedEvent.type === 'ISSUE' ? 'Issue Details' : 'Interaction Record'}
                                </h3>
                                <p className="text-slate-500 font-medium text-sm mt-1">
                                    Logged exactly on {selectedEvent.date.toLocaleString()}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedEvent(null)}
                                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/60 w-full mb-6">
                            {selectedEvent.type === 'ISSUE' && (
                                <div className="space-y-4">
                                    <div className="flex flex-col border-b border-white pb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Category</span>
                                        <span className="text-sm font-medium text-slate-800">{Array.isArray(selectedEvent.data.category) ? selectedEvent.data.category.join(', ') : selectedEvent.data.category}</span>
                                    </div>
                                    <div className="flex flex-col border-b border-white pb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</span>
                                        <span className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{selectedEvent.data.description}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                            <span className="text-sm font-medium text-slate-800">{selectedEvent.data.status}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reported Via</span>
                                            <span className="text-sm font-medium text-slate-800">{selectedEvent.data.managementMethod || 'Unknown'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Reported</span>
                                            <span className="text-sm font-medium text-slate-800">{new Date(selectedEvent.data.dateStarted || selectedEvent.data.date_reported).toLocaleDateString()}</span>
                                        </div>
                                        {(selectedEvent.data.repairDeadline || selectedEvent.data.repair_deadline) && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Repair Deadline</span>
                                                <span className="text-sm font-medium text-slate-800">{new Date(selectedEvent.data.repairDeadline || selectedEvent.data.repair_deadline).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.type === 'INTERACTION' && (
                                <div className="space-y-4">
                                    <div className="flex flex-col border-b border-white pb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Summary</span>
                                        <span className="text-sm font-medium text-slate-800">{selectedEvent.data.summary}</span>
                                    </div>
                                    <div className="flex flex-col border-b border-white pb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Detailed Notes</span>
                                        <span className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{selectedEvent.data.detailedNotes || selectedEvent.data.detailed_notes || 'No detailed notes provided.'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Interaction Type</span>
                                            <span className="text-sm font-medium text-slate-800">{selectedEvent.data.interactionType || selectedEvent.data.interaction_type || 'Other'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff Member</span>
                                            <span className="text-sm font-medium text-slate-800">{selectedEvent.data.staffName || selectedEvent.data.staff_name} <span className="opacity-60">({selectedEvent.data.staffTitle || selectedEvent.data.staff_role})</span></span>
                                        </div>
                                        {(selectedEvent.data.promiseMadeStatus || selectedEvent.data.promise_made) && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Promise Made?</span>
                                                <span className="text-sm font-medium text-slate-800">{selectedEvent.data.promiseMadeStatus || (selectedEvent.data.promise_made ? 'Yes' : 'No')}</span>
                                            </div>
                                        )}
                                        {(selectedEvent.data.promiseMadeDetails || selectedEvent.data.promise_details) && (
                                            <div className="flex flex-col col-span-2 mt-2 border-t border-white pt-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Promise Details</span>
                                                <span className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{selectedEvent.data.promiseMadeDetails || selectedEvent.data.promise_details}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl flex items-center text-blue-800 text-xs">
                            <i className="fa-solid fa-shield-halved mr-3 opacity-70"></i>
                            This forms part of the official legal immutable record for standard legal evidence procedure.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvidenceTimeline;
