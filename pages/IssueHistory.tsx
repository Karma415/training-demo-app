import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import IssueHistoryComponent from '../components/IssueHistory';
import InteractionForm from '../components/InteractionForm';
import { Issue } from '../types';
import { supabase } from '../services/supabase';

const toInteractionTypeValue = (value?: string) => {
    switch (value) {
        case 'Phone':
            return 'phone_call';
        case 'Email':
        case 'Letter':
            return 'email';
        case 'Text':
            return 'text_message';
        case 'In-Person':
        case 'Maintenance Visit':
        case 'Office Visit':
        case 'Other':
        default:
            return 'in_person';
    }
};

const toTopicArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value;
    return value ? [String(value)] : [];
};

const IssueHistory: React.FC = () => {
    const { issues, user, fetchIssues, interactionLogs, setInteractionLogs } = useApp();
    const { issueId } = useParams<{ issueId?: string }>();
    const [activeInteractionIssue, setActiveInteractionIssue] = useState<Issue | null>(null);

    useEffect(() => {
        fetchIssues();
    }, []);

    const handleSaveInteraction = async (log: any) => {
        const { isResolved, resolutionDetails, resolvedDate, ...rest } = log;
        const tempId = 'log_' + Date.now().toString();

        let finalDetailedNotes = rest.detailedNotes;
        if (isResolved) {
            finalDetailedNotes += `\n\n### RESOLUTION DETAILS ###\nDate Resolved: ${resolvedDate}\nExplanation: ${resolutionDetails}`;
        }

        const newEntry = { id: tempId, ...rest, detailedNotes: finalDetailedNotes };

        // Optimistic update
        setInteractionLogs([newEntry as any, ...interactionLogs]);
        setActiveInteractionIssue(null);

        try {
            // 1. Save Interaction
            const { error: sbError } = await supabase
                .from('interactions')
                .insert({
                    tenant_id: user.id || rest.tenantId,
                    staff_name: rest.staffName,
                    staff_role: rest.staffTitle,
                    interaction_type: toInteractionTypeValue(rest.interactionType),
                    topic: toTopicArray(rest.interactionCategory),
                    detailed_notes: finalDetailedNotes,
                    promise_made: rest.promiseMadeStatus === 'Yes',
                    promise_details: rest.promiseMadeDetails,
                    follow_up_date: rest.expectedFollowUpDates || null,
                    summary: rest.summary,
                    issue_id: rest.relatedIssueId || null,
                    created_at: rest.timestamp ? new Date(rest.timestamp).toISOString() : undefined
                });

            if (sbError) throw sbError;

            // 2. Update Issue Status if Resolved
            if (isResolved && rest.relatedIssueId) {
                const { error: issueError } = await supabase
                    .from('issues')
                    .update({ status: 'resolved' })
                    .eq('id', rest.relatedIssueId);

                if (issueError) throw issueError;

                // Refresh issues to update UI (Generate Letter button etc)
                await fetchIssues();
            }
        } catch (error) {
            error;
            console.error("Failed to persist interaction log:", error);
            // Optional: rollback on error
        }
    };

    return (
        <>
            <IssueHistoryComponent
                issues={issues}
                highlightedId={issueId}
            />

            {activeInteractionIssue && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm -z-10" onClick={() => setActiveInteractionIssue(null)}></div>
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-2xl font-bold text-slate-800">Document Issue Update</h3>
                                <button onClick={() => setActiveInteractionIssue(null)} className="text-slate-400 hover:text-slate-600">
                                    <i className="fa-solid fa-xmark text-xl"></i>
                                </button>
                            </div>
                            <InteractionForm
                                onSubmit={handleSaveInteraction}
                                onCancel={() => setActiveInteractionIssue(null)}
                                currentTenantId={user.id}
                                availableIssues={issues}
                                initialData={{
                                    relatedIssueId: activeInteractionIssue.id,
                                    interactionCategory: Array.isArray(activeInteractionIssue.category) ? activeInteractionIssue.category : [activeInteractionIssue.category as any]
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default IssueHistory;
