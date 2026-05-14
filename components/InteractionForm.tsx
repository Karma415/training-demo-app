import React, { useState } from 'react';
import { InteractionLogEntry, InteractionType, Issue } from '../types';

interface InteractionFormProps {
    onSubmit: (log: Omit<InteractionLogEntry, 'id'>) => void;
    onCancel: () => void;
    initialData?: Partial<InteractionLogEntry>;
    currentTenantId: string;
    availableIssues?: Issue[];
    isSimplified?: boolean;
}

const InteractionForm: React.FC<InteractionFormProps> = ({
    onSubmit,
    onCancel,
    initialData,
    currentTenantId,
    availableIssues = [],
    isSimplified = false
}) => {
    const [newLog, setNewLog] = useState<Omit<InteractionLogEntry, 'id'>>({
        tenantId: currentTenantId,
        interactionType: 'In-Person',
        location: '',
        staffName: '',
        staffTitle: '',
        summary: isSimplified ? 'Issue Update' : '',
        detailedNotes: '',
        interactionCategory: [],
        promiseMadeStatus: 'No',
        promiseMadeDetails: '',
        expectedFollowUpDates: '',
        relatedIssueId: '',
        timestamp: new Date().toISOString().split('T')[0],
        ...initialData
    });

    const topics = [
        '🙂 Neutral/Friendly',
        '🤨 Dismissive/Rude',
        '😠 Aggressive/Hostile',
        '🚪 Illegal Entry/Visitor Denied'
    ];

    const showLocationField = ['In-Person', 'Maintenance Visit', 'Office Visit'].includes(newLog.interactionType);

    const [isResolved, setIsResolved] = useState(false);
    const [resolutionDetails, setResolutionDetails] = useState('');
    const [resolvedDate, setResolvedDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...newLog,
            isResolved,
            resolutionDetails,
            resolvedDate
        } as any);
    };

    const toggleTopic = (topic: string) => {
        setNewLog(prev => {
            const currentCategories = Array.isArray(prev.interactionCategory) ? prev.interactionCategory : [];
            return {
                ...prev,
                interactionCategory: currentCategories.includes(topic)
                    ? currentCategories.filter(t => t !== topic)
                    : [...currentCategories, topic]
            };
        });
    };

    const isLocked = !!initialData?.relatedIssueId;
    const isPromiseLocked = initialData?.promiseMadeStatus === 'Yes';

    return (
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Interaction Type</label>
                    <select
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                        value={newLog.interactionType}
                        onChange={e => setNewLog({ ...newLog, interactionType: e.target.value as InteractionType })}
                    >
                        <option value="In-Person">In-Person</option>
                        <option value="Maintenance Visit">Maintenance Visit</option>
                        <option value="Office Visit">Office Visit</option>
                        <option value="Phone">Phone Call</option>
                        <option value="Email">Email</option>
                        <option value="Letter">Formal Letter</option>
                        <option value="Text">Text Message</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Date of Interaction</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                        value={newLog.timestamp || ''}
                        onChange={e => setNewLog({ ...newLog, timestamp: e.target.value })}
                    />
                </div>
            </div>

            {availableIssues.length > 0 && (
                <div>
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2 flex items-center">
                        Related Issue {isLocked && <i className="fa-solid fa-lock ml-2 text-slate-300"></i>}
                    </label>
                    <select
                        disabled={isLocked}
                        className={`w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all truncate ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        value={newLog.relatedIssueId || ''}
                        onChange={e => setNewLog({ ...newLog, relatedIssueId: e.target.value })}
                    >
                        <option value="">-- No Specific Issue --</option>
                        <option value="NEW_ISSUE" className="text-blue-600 font-bold">✨ New Issue / Problem to report ✨</option>
                        {availableIssues.map(issue => (
                            <option key={issue.id} value={issue.id}>
                                {Array.isArray(issue.category) ? issue.category[0] : issue.category} - {issue.description.substring(0, 40)}{issue.description.length > 40 ? '...' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Staff Name</label>
                    <input
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Who conducted interaction?"
                        value={newLog.staffName}
                        onChange={e => setNewLog({ ...newLog, staffName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Staff Role/Title</label>
                    <input
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. Case Manager"
                        value={newLog.staffTitle}
                        onChange={e => setNewLog({ ...newLog, staffTitle: e.target.value })}
                    />
                </div>
            </div>

            {showLocationField && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Location</label>
                    <input
                        required={showLocationField}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. Front Desk, Unit 302"
                        value={newLog.location}
                        onChange={e => setNewLog({ ...newLog, location: e.target.value })}
                    />
                </div>
            )}

            <div>
                <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Vibe Check (Multi-select)</label>
                <div className="flex flex-wrap gap-2">
                    {Array.from(new Set([...topics, ...(Array.isArray(initialData?.interactionCategory) ? initialData.interactionCategory : [])])).map(t => {
                        const isTopicLocked = isLocked && Array.isArray(initialData?.interactionCategory) && initialData.interactionCategory.includes(t);
                        const isSelected = Array.isArray(newLog.interactionCategory) && newLog.interactionCategory.includes(t);
                        return (
                            <button
                                key={t}
                                type="button"
                                disabled={isTopicLocked}
                                onClick={() => toggleTopic(t)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 flex items-center ${isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                    } ${isTopicLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {t}
                                {isTopicLocked && <i className="fa-solid fa-lock ml-2 text-xs opacity-50"></i>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {!isSimplified && (
                <div>
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Summary</label>
                    <input
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Brief overview of interaction"
                        value={newLog.summary}
                        onChange={e => setNewLog({ ...newLog, summary: e.target.value })}
                    />
                </div>
            )}

            <div>
                <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">
                    {isSimplified ? 'Additional Notes' : 'Detailed Notes'}
                </label>
                <textarea
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 h-32 resize-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Information to be added"
                    value={newLog.detailedNotes}
                    onChange={e => setNewLog({ ...newLog, detailedNotes: e.target.value })}
                />
            </div>

            <div className="flex items-center space-x-6">
                <label className={`flex items-center space-x-3 group ${isPromiseLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                    <div className={`w-12 h-6 rounded-full p-1 transition-all ${newLog.promiseMadeStatus === 'Yes' ? 'bg-green-500' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-sm ${newLog.promiseMadeStatus === 'Yes' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        disabled={isPromiseLocked}
                        checked={newLog.promiseMadeStatus === 'Yes'}
                        onChange={e => setNewLog({ ...newLog, promiseMadeStatus: e.target.checked ? 'Yes' : 'No' })}
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800 transition-colors flex items-center">
                        Promises Made?
                        {isPromiseLocked && <i className="fa-solid fa-lock ml-2 text-xs text-slate-400"></i>}
                    </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer group border-l pl-6 border-slate-100">
                    <div className={`w-12 h-6 rounded-full p-1 transition-all ${isResolved ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isResolved ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={isResolved}
                        onChange={e => setIsResolved(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Issue Resolved?</span>
                </label>
            </div>

            {isResolved && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100">
                        <label className="block text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">Resolution Explanation</label>
                        <textarea
                            required={isResolved}
                            className="w-full bg-white border-none rounded-2xl p-4 font-semibold text-emerald-900 h-24 resize-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            placeholder="Please explain how the issue was resolved."
                            value={resolutionDetails}
                            onChange={e => setResolutionDetails(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Date Resolved</label>
                        <input
                            type="date"
                            required={isResolved}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                            value={resolvedDate}
                            onChange={e => setResolvedDate(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {newLog.promiseMadeStatus === 'Yes' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2 flex items-center">
                        Brief Summary of Promise
                        {isPromiseLocked && <i className="fa-solid fa-lock ml-2 text-slate-300"></i>}
                    </label>
                    <input
                        required
                        disabled={isPromiseLocked}
                        className={`w-full bg-green-50 border-none rounded-2xl p-4 font-semibold text-green-900 focus:ring-2 focus:ring-green-500 transition-all placeholder-green-700/50 ${isPromiseLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
                        placeholder="Please document what was promised..."
                        value={newLog.promiseMadeDetails}
                        onChange={e => setNewLog({ ...newLog, promiseMadeDetails: e.target.value })}
                    />
                </div>
            )}

            {!isResolved && (
                <div>
                    <label className="block text-xs font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Follow-up Date</label>
                    <input
                        type="date"
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newLog.expectedFollowUpDates}
                        onChange={e => setNewLog({ ...newLog, expectedFollowUpDates: e.target.value })}
                    />
                </div>
            )}

            <div className="flex space-x-4 mt-4">
                <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-5 rounded-2xl transition-all">
                    Cancel
                </button>
                <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">
                    Commit to Official Log
                </button>
            </div>
        </form>
    );
};

export default InteractionForm;
