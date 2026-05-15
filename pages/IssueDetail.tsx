import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import InteractionForm from '../components/InteractionForm';
import EvidenceTimeline from '../components/EvidenceTimeline';
import EscalationTracker from '../components/EscalationTracker';
import EvidenceUploader from '../components/EvidenceUploader';
import RentCalculator from '../components/RentCalculator';
import AgencySubmission from '../components/AgencySubmission';
import LegalNoticeBuilder from '../components/LegalNoticeBuilder';
import LegalIssueDetail from '../components/LegalIssueDetail';
import { getEvidenceThumbnailUrl } from '../utils/evidenceFiles';

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

const IssueDetail: React.FC = () => {
    const { issueId } = useParams<{ issueId: string }>();
    const { issues, interactionLogs, setInteractionLogs, user, fetchIssues } = useApp();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
    const [showAgencyDashboard, setShowAgencyDashboard] = useState(false);
    const [showLegalNoticeBuilder, setShowLegalNoticeBuilder] = useState(false);

    const issue = issues.find(i => i.id === issueId);
    const relatedLogs = interactionLogs.filter(log => log.relatedIssueId === issueId);

    const fetchEvidence = async () => {
        if (!issueId) return;
        try {
            const { data, error } = await supabase
                .from('evidence_files')
                .select('*')
                .eq('issue_id', issueId);
            
            if (error) throw error;
            if (data) setEvidenceFiles(data);
        } catch (err) {
            console.error("Failed to fetch evidence files:", err);
        }
    };

    React.useEffect(() => {
        fetchEvidence();
    }, [issueId]);

    if (!issue) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-xl border border-slate-100">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-triangle-exclamation text-3xl text-rose-500"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Issue Not Found</h2>
                <p className="text-slate-500 mt-2 font-medium">The issue you are looking for might have been removed or does not exist.</p>
                <button
                    onClick={() => navigate('/issues')}
                    className="mt-8 bg-[#1e3a8a] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg"
                >
                    Back to All Issues
                </button>
            </div>
        );
    }

    // Attorney/Legal View Router
    if (user.role === 'legal_counsel') {
        return <LegalIssueDetail issue={issue} user={user} />;
    }


    const handleSaveInteraction = async (log: any) => {
        setIsSaving(true);
        try {
            // Include resolution details if present
            let detailedNotes = log.detailedNotes;
            if (log.isResolved && log.resolutionDetails) {
                detailedNotes += `\n\n--- RESOLUTION DETAILS ---\nResolution Explanation: ${log.resolutionDetails}\nDate Resolved: ${log.resolvedDate}`;
            }

            const { data, error } = await supabase
                .from('interactions')
                .insert({
                    tenant_id: user.id,
                    staff_name: log.staffName,
                    staff_role: log.staffTitle,
                    interaction_type: toInteractionTypeValue(log.interactionType),
                    topic: toTopicArray(log.interactionCategory),
                    detailed_notes: detailedNotes,
                    promise_made: log.promiseMadeStatus === 'Yes',
                    promise_details: log.promiseMadeDetails,
                    follow_up_date: log.expectedFollowUpDates || null,
                    summary: log.summary,
                    issue_id: issueId,
                    created_at: log.timestamp ? new Date(log.timestamp).toISOString() : undefined
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newLogEntry = {
                    id: data.id,
                    tenantId: data.tenant_id,
                    interactionType: data.interaction_type,
                    staffName: data.staff_name,
                    staffTitle: data.staff_role,
                    summary: data.summary,
                    detailedNotes: data.detailed_notes,
                    interactionCategory: data.interaction_category,
                    promiseMadeStatus: (data.promise_made ? 'Yes' : 'No') as 'Yes' | 'No',
                    promiseMadeDetails: data.promise_details,
                    expectedFollowUpDates: data.follow_up_date,
                    relatedIssueId: data.issue_id,
                    location: data.location || 'Unknown',
                    timestamp: data.created_at
                };
                setInteractionLogs([newLogEntry, ...interactionLogs]);

                // Update issue status if resolved
                if (log.isResolved) {
                    const { error: issueError } = await supabase
                        .from('issues')
                        .update({ status: 'resolved' })
                        .eq('id', issueId);

                    if (issueError) throw issueError;
                    await fetchIssues();
                }
            }
        } catch (err) {
            console.error("Failed to save interaction:", err);
            alert("Failed to save update. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Breadcrumb */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/issues')}
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1e3a8a] hover:border-[#1e3a8a] transition-all shadow-sm"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">Issue Details</h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Audit Trail & Evidence Timeline</p>
                </div>
            </div>

            {/* Issue Summary Card */}
            <div className="bg-white rounded-2xl sm:rounded-[40px] shadow-2xl border border-slate-50 overflow-hidden">
                <div className="bg-[#1e3a8a] p-4 sm:p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start relative z-10 gap-4">
                        <div>
                            <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                                {Array.isArray(issue.category) ? issue.category.join(' / ') : issue.category}
                            </span>
                            <h2 className="text-base sm:text-2xl font-black mt-3 sm:mt-4 leading-tight">{issue.description}</h2>
                        </div>
                        <div className="sm:text-right flex sm:block items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg ${issue.status === 'Resolved' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'
                                }`}>
                                {issue.status}
                            </span>
                            <div className="mt-4 text-white/80">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Reported On</p>
                                <p className="font-bold">{isNaN(new Date(issue.dateStarted).getTime()) ? 'Unknown Date' : new Date(issue.dateStarted).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {issue.status !== 'Resolved' && (
                    <div className="px-4 sm:px-8 pt-6 sm:pt-8 -mb-4">
                        <EscalationTracker 
                            issueName={issue.description} 
                            createdAt={issue.dateStarted} 
                            repairClockHours={(issue as any).repairClockHours ?? (issue as any).repair_clock_hours ?? 24} 
                            onGenerateLetter={() => {
                                setShowLegalNoticeBuilder(true);
                            }}
                        />
                    </div>
                )}

                {/* Evidence Uploader & Gallery Section */}
                <div className="px-4 sm:px-8 pt-6 sm:pt-8 space-y-4 sm:space-y-6">
                    <div>
                        <h3 className="text-sm sm:text-lg font-black uppercase tracking-widest text-[#1e3a8a]">Evidence</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Use this section to upload your photos, videos, and documents. Acceptable formats: pdf, jpg, etc.
                        </p>
                    </div>
                    
                    <EvidenceUploader issueId={issue.id} tenantId={user.id} onUploadSuccess={fetchEvidence} />
                    
                    {evidenceFiles.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                            {evidenceFiles.map(file => {
                                const hasMetadata = file.metadata && (file.metadata.latitude || file.metadata.timestamp);
                                const thumbnailUrl = getEvidenceThumbnailUrl(file);
                                return (
                                <a key={file.id} href={file.file_path} target="_blank" rel="noreferrer" className="block relative aspect-square rounded-2xl overflow-hidden shadow-md group border border-slate-100 bg-slate-100/50">
                                    {thumbnailUrl ? (
                                        <img src={thumbnailUrl} alt={file.metadata?.filename || "Evidence"} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                            <i className="fa-solid fa-file text-4xl"></i>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                                        <i className="fa-solid fa-expand text-white text-2xl mb-2 shadow-sm"></i>
                                        {hasMetadata && (
                                            <div className="text-[9px] text-white/90 bg-black/40 px-2 flex flex-col py-1.5 rounded-lg backdrop-blur-md shadow-lg border border-white/10 mt-2 font-mono tracking-tight leading-loose w-full max-w-[90%]">
                                                {file.metadata.timestamp && <span className="truncate"><i className="fa-regular fa-clock mr-1 text-emerald-400"></i>{file.metadata.timestamp}</span>}
                                                {file.metadata.latitude && file.metadata.longitude && (
                                                    <span className="truncate"><i className="fa-solid fa-location-dot mr-1 text-emerald-400"></i>{file.metadata.latitude.toFixed(5)}, {file.metadata.longitude.toFixed(5)}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {hasMetadata && (
                                        <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full shadow-md flex items-center">
                                            <i className="fa-solid fa-shield-halved mr-1.5"></i> Verifiable
                                        </div>
                                    )}
                                </a>
                            )})}
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                    <div className="md:col-span-2 space-y-6">
                        
                        <RentCalculator issue={issue} tenant={user} interactions={interactionLogs} />
                        
                    </div>
                    <div className="space-y-6">
                        {issue.status !== 'Resolved' && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowAgencyDashboard(true)}
                                    className="w-full bg-rose-600 text-white py-3 sm:py-4 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95 flex justify-center items-center"
                                >
                                    <i className="fa-solid fa-building-shield mr-2"></i> File Oversight Agency Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline Section */}
            <div className="space-y-6">
                <div className="flex items-center space-x-3 text-indigo-600">
                    <i className="fa-solid fa-timeline text-xl"></i>
                    <h2 className="text-sm sm:text-xl font-black uppercase tracking-tight">Evidence & History Timeline</h2>
                </div>
                <div className="bg-white rounded-2xl sm:rounded-[40px] shadow-xl border border-slate-50 p-4 sm:p-10">
                    <EvidenceTimeline
                        issues={[issue]}
                        interactions={relatedLogs}
                        filterCategory="All"
                    />
                </div>
            </div>

            {/* Document Update Section */}
            <div className="space-y-6">
                <div className="flex items-center space-x-3 text-blue-600">
                    <i className="fa-solid fa-file-pen text-xl"></i>
                    <h2 className="text-sm sm:text-xl font-black uppercase tracking-tight">Add Information / Document Update</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 -mb-2">
                    Once you enter your information and click the commit to official log button, you will no longer be able to change that information; it will forever be in the records.
                </p>
                <div className="bg-white rounded-2xl sm:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Simplified Documentation Form</p>
                    </div>
                    {isSaving ? (
                        <div className="p-20 text-center">
                            <div className="w-12 h-12 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing with Audit Trail...</p>
                        </div>
                    ) : (
                        <InteractionForm
                            isSimplified={true}
                            currentTenantId={user.id || user.name}
                            availableIssues={[issue!]}
                            initialData={{
                                relatedIssueId: issue.id,
                                interactionCategory: Array.isArray(issue.category) ? issue.category : [issue.category]
                            }}
                            onSubmit={handleSaveInteraction}
                            onCancel={() => navigate('/issues')}
                        />
                    )}
                </div>
            </div>

            {showAgencyDashboard && user && (
                <AgencySubmission
                    issue={issue!}
                    interactions={relatedLogs}
                    evidenceFiles={evidenceFiles}
                    tenantName={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name}
                    tenantUnit={user.unit}
                    onClose={() => setShowAgencyDashboard(false)}
                />
            )}

            {showLegalNoticeBuilder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <LegalNoticeBuilder
                            initialIncidentId={issue!.id}
                            onClose={() => setShowLegalNoticeBuilder(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueDetail;
