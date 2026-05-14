import React, { useState } from 'react';
import { InteractionLogEntry, Issue } from '../types';
import InteractionForm from './InteractionForm';
import { useNavigate } from 'react-router-dom';

interface DailyStaffInteractionsProps {
    logs: InteractionLogEntry[];
    onAdd: (log: Omit<InteractionLogEntry, 'id'>) => void;
    currentTenantId: string;
    issues: Issue[]; // Added issues prop
}

const DailyStaffInteractions: React.FC<DailyStaffInteractionsProps> = ({ logs, onAdd, currentTenantId, issues }) => {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [newLog, setNewLog] = useState<Omit<InteractionLogEntry, 'id'>>({
        tenantId: currentTenantId,
        interactionType: 'In-Person',
        location: '',
        staffName: '',
        staffTitle: '', // Updated
        summary: '',
        detailedNotes: '',
        interactionCategory: [],
        promiseMadeStatus: 'No', // Updated to string logic
        promiseMadeDetails: '', // Updated
        expectedFollowUpDates: '', // Updated
        relatedIssueId: '',
        timestamp: new Date().toISOString()
    });

    const handleLogClick = (log: InteractionLogEntry) => {
        if (log.relatedIssueId === 'NEW_ISSUE') {
            navigate('/?newIssue=true');
        } else if (log.relatedIssueId) {
            navigate(`/issues/${log.relatedIssueId}`);
        }
    };

    return (
        <div className="mt-12 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 p-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Staff Interaction Log</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Official Record of Daily Engagement</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 active:scale-95 shadow-lg shadow-blue-900/40"
                >
                    <i className="fa-solid fa-file-signature text-lg"></i>
                    <span>Log New Interaction</span>
                </button>
            </div>

            <div className="p-8">
                {showForm && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-2xl font-bold text-slate-800">Record Staff Interaction</h3>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                    <i className="fa-solid fa-xmark text-xl"></i>
                                </button>
                            </div>
                            <InteractionForm
                                onSubmit={(log) => {
                                    onAdd(log);
                                    setShowForm(false);
                                    setNewLog({
                                        tenantId: currentTenantId,
                                        interactionType: 'In-Person',
                                        location: '',
                                        staffName: '',
                                        staffTitle: '',
                                        summary: '',
                                        detailedNotes: '',
                                        interactionCategory: [],
                                        promiseMadeStatus: 'No',
                                        promiseMadeDetails: '',
                                        expectedFollowUpDates: '',
                                        relatedIssueId: '',
                                        timestamp: new Date().toISOString().split('T')[0]
                                    });
                                }}
                                onCancel={() => setShowForm(false)}
                                currentTenantId={currentTenantId}
                                initialData={newLog}
                                availableIssues={issues} // Pass issues prop
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {logs.length > 0 ? (
                        logs.map(log => (
                            <div 
                                key={log.id} 
                                onClick={() => handleLogClick(log)}
                                className={`group border-2 border-slate-50 hover:border-blue-50 rounded-3xl p-6 transition-all hover:shadow-xl bg-slate-50/30 ${log.relatedIssueId ? 'cursor-pointer hover:bg-white' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                                            <i className={`fa-solid text-xl ${log.interactionType === 'Phone' ? 'fa-phone-volume' :
                                                log.interactionType === 'Email' ? 'fa-envelope-open-text' :
                                                    log.interactionType === 'Letter' ? 'fa-file-invoice' : 'fa-people-arrows'
                                                }`}></i>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-800">{log.summary}</h4>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">{log.staffName} • {log.staffTitle}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{log.expectedFollowUpDates ? `Due: ${new Date(log.expectedFollowUpDates).toLocaleDateString()}` : 'No Follow-up'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {log.promiseMadeStatus === 'Yes' && (
                                        <div className="bg-green-50 text-green-700 border border-green-100 rounded-full px-4 py-2 flex items-center space-x-2">
                                            <i className="fa-solid fa-handshake text-xs"></i>
                                            <span className="text-xs font-black uppercase tracking-widest">Promises Logged</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                    <div className="md:col-span-3">
                                        <p className="text-slate-600 font-medium leading-relaxed italic pr-8">
                                            "{log.detailedNotes}"
                                            {log.promiseMadeStatus === 'Yes' && log.promiseMadeDetails && <span className="block mt-2 font-bold text-green-700 not-italic">Promise: {log.promiseMadeDetails}</span>}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {(Array.isArray(log.interactionCategory) ? log.interactionCategory : []).map(t => (
                                                <span key={t} className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1 rounded-md">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-50 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Location</p>
                                        <p className="text-sm font-bold text-slate-700 text-center">{log.location || 'Not Specified'}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[40px]">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fa-solid fa-pen-nib text-3xl text-slate-300"></i>
                            </div>
                            <h3 className="text-2xl font-black text-slate-300">No Interactions Recorded Yet</h3>
                            <p className="text-slate-400 mt-2 font-medium">Log your first interaction to start building an official audit trail.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyStaffInteractions;
