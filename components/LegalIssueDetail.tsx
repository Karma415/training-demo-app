import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import EvidenceTimeline from './EvidenceTimeline';
import RentCalculator from './RentCalculator';
import { Download, FileText, ArrowLeft, SortDesc, SortAsc, ShieldCheck, CheckCircle2, Factory } from 'lucide-react';
import { Issue, Tenant, InteractionLogEntry } from '../types';
import { getEvidenceThumbnailUrl } from '../utils/evidenceFiles';

interface LegalIssueDetailProps {
    issue: Issue;
    user: Tenant;
}

const LegalIssueDetail: React.FC<LegalIssueDetailProps> = ({ issue, user }) => {
    const navigate = useNavigate();
    
    // State to hold fetched data specific to this issue since AppContext might not have it for the attorney
    const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
    const [legalNotices, setLegalNotices] = useState<any[]>([]);
    const [interactionLogs, setInteractionLogs] = useState<InteractionLogEntry[]>([]);
    const [timelineSortOrder, setTimelineSortOrder] = useState<'asc' | 'desc'>('desc');
    
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // Fetch resources related to this issue
    useEffect(() => {
        const fetchIssueData = async () => {
            if (!issue.id) return;

            try {
                // Fetch tenant if not available
                if (issue.tenantId) {
                    const { data: tenantData } = await supabase
                        .from('tenants')
                        .select('*')
                        .eq('id', issue.tenantId)
                        .single();
                    if (tenantData) {
                        const hasName = tenantData.first_name || tenantData.last_name;
                        setTenant({
                            id: tenantData.id,
                            name: hasName ? `${tenantData.first_name || ''} ${tenantData.last_name || ''}`.trim() : tenantData.email || 'Unknown Tenant',
                            firstName: tenantData.first_name,
                            lastName: tenantData.last_name,
                            unit: tenantData.unit_number ? tenantData.unit_number.toString() : 'Unassigned',
                            email: tenantData.email,
                            monthlyRent: tenantData.monthly_rent || 0,
                        } as Tenant);
                    }
                }

                // 1. Evidence Files
                const { data: evidence } = await supabase
                    .from('evidence_files')
                    .select('*')
                    .eq('issue_id', issue.id);
                if (evidence) setEvidenceFiles(evidence);

                // 2. Legal Notices
                const { data: notices } = await supabase
                    .from('legal_notices')
                    .select('*')
                    .eq('issue_id', issue.id)
                    .order('created_at', { ascending: false });
                if (notices) setLegalNotices(notices);

                // 3. Interactions
                const { data: logs } = await supabase
                    .from('interactions')
                    .select('*')
                    .eq('issue_id', issue.id)
                    .order('created_at', { ascending: false });
                
                if (logs) {
                    const mappedLogs = logs.map(l => ({
                        id: l.id,
                        staffName: l.staff_name,
                        staffRole: l.staff_role,
                        interactionType: l.interaction_type,
                        interactionCategory: Array.isArray(l.topic) ? l.topic : (l.topic ? l.topic.split(',').map((s: string) => s.trim()) : []),
                        detailedNotes: l.detailed_notes,
                        promiseMadeStatus: l.promise_made ? 'Yes' : 'No',
                        promiseMadeDetails: l.promise_details,
                        expectedFollowUpDates: l.follow_up_date,
                        timestamp: l.created_at,
                        relatedIssueId: l.issue_id,
                        location: l.location || 'Unknown'
                    }));
                    setInteractionLogs(mappedLogs as any);
                }
            } catch (err) {
                console.error("Failed fetching data for legal view", err);
            }
        };

        fetchIssueData();
    }, [issue.id, issue.tenantId]);

    // Handle Download
    const downloadFile = async (fileUrl: string, filename: string) => {
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed", e);
            // Fallback: open in new tab
            window.open(fileUrl, '_blank');
        }
    };

    // Calculate dates
    const reportedDateStr = isNaN(new Date(issue.dateStarted).getTime()) 
        ? 'Unknown Date' 
        : new Date(issue.dateStarted).toLocaleDateString();

    const repairClockHours = (issue as any).repairClockHours || (issue as any).repair_clock_hours || 24; 
    const timelineDeadline = new Date(new Date(issue.dateStarted).getTime() + repairClockHours * 60 * 60 * 1000);
    const deadlineStr = isNaN(timelineDeadline.getTime()) ? 'Unknown' : timelineDeadline.toLocaleDateString();

    // Get notified agencies based on interactions
    const notifiedAgencies = interactionLogs.filter(log => 
        log.interactionCategory?.includes('DBI') || 
        log.interactionCategory?.includes('DPH') || 
        log.detailedNotes?.includes('DBI') ||
        log.detailedNotes?.includes('DPH')
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Nav */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-700 hover:border-indigo-300 transition-all shadow-sm"
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Legal Case Review</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Tenant: {tenant?.name || 'Loading...'} (Unit {tenant?.unit})</p>
                </div>
            </div>

            {/* Core Legal Facts */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 space-y-8">
                    <h2 className="text-xl font-black text-slate-800 border-b pb-4">Incident Facts</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Issue Status</label>
                                <div className="text-sm font-bold mt-1 text-slate-800 flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${issue.status === 'Resolved' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                    {issue.status} Issue
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Incident Reported On</label>
                                <div className="text-sm font-bold mt-1 text-slate-800">
                                    {reportedDateStr}
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Legal Code</label>
                                <div className="text-sm font-bold mt-1 text-slate-800 flex items-center">
                                    <ShieldCheck size={16} className="text-indigo-600 mr-2" />
                                    {issue.rule?.legal_citation || 'Unknown Citation'}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Allowed Repair Time (Deadline)</label>
                                <div className="text-sm font-medium mt-1 text-slate-600">
                                    By law, the landlord had <span className="font-bold text-slate-800">{Math.floor(repairClockHours / 24)} days</span> to resolve this. 
                                    <br/>That deadline was on <span className="font-bold text-rose-600">{deadlineStr}</span>.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Letters Generated */}
                    <div className="border-t pt-6 bg-slate-50/50 rounded-lg p-6">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center mb-4">
                            <FileText size={14} className="mr-2" /> Formal Notices Generated
                        </label>
                        {legalNotices.length > 0 ? (
                            <div className="space-y-3">
                                {legalNotices.map((notice) => (
                                    <div key={notice.id} className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                        <div>
                                            <p className="font-bold text-slate-700">{notice.notice_type || 'Legal Notice'}</p>
                                            <p className="text-xs text-slate-500">Generated on: {new Date(notice.sent_at || notice.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <button 
                                            // Ideally opens a modal with notice.content, simplifying to alert or new window for now
                                            onClick={() => alert(`Content preview:\n\n${notice.content}`)}
                                            className="text-xs bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                                        >
                                            View Notice
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 font-medium">No official letters or notices have been generated for this issue yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Timelines and Logging */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Audit Trail & Evidence Timeline</h2>
                    <button 
                        onClick={() => setTimelineSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="text-xs flex items-center font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                    >
                        {timelineSortOrder === 'asc' ? <SortAsc size={16} className="mr-2" /> : <SortDesc size={16} className="mr-2" />}
                        Sort {timelineSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </button>
                </div>
                
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 p-6">
                    <EvidenceTimeline
                        issues={[issue]}
                        interactions={interactionLogs}
                        sortOrder={timelineSortOrder}
                        filterCategory="All"
                    />
                </div>
            </div>

            {/* Evidence Gallery (View Only + Download) */}
            <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-800 tracking-tight border-b pb-2">Tenant Uploaded Evidence</h2>
                {evidenceFiles.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {evidenceFiles.map(file => {
                            const thumbnailUrl = getEvidenceThumbnailUrl(file);

                            return (
                            <div key={file.id} className="block relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50 group">
                                {thumbnailUrl ? (
                                    <img src={thumbnailUrl} alt={file.metadata?.filename || 'Evidence'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                        <FileText className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3 pt-8">
                                    <p className="text-[10px] text-white/90 font-mono line-clamp-2">
                                        {file.metadata?.filename || file.caption || 'Evidence File'}
                                    </p>
                                </div>
                                
                                {/* Download Overlay Action */}
                                <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            downloadFile(file.file_path, file.metadata?.filename || 'evidence.jpg');
                                        }}
                                        className="bg-white text-indigo-700 px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center"
                                    >
                                        <Download size={14} className="mr-2" />
                                        Download File
                                    </button>
                                </div>
                            </div>
                        )})}
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl text-center">
                        <p className="text-slate-400 font-medium">No evidence has been uploaded by the tenant for this issue.</p>
                    </div>
                )}
            </div>

            {/* Oversight Agencies */}
            <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-800 tracking-tight border-b pb-2">Oversight Agencies Notified</h2>
                {notifiedAgencies.length > 0 ? (
                    <div className="space-y-3">
                        {notifiedAgencies.map(agency => (
                            <div key={agency.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-700 flex items-center">
                                        <Factory size={16} className="text-emerald-600 mr-2" />
                                        Agency Notification Logged
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{agency.summary}</p>
                                </div>
                                <div className="mt-2 sm:mt-0 text-left sm:text-right">
                                    <p className="text-xs font-bold font-mono text-slate-400">Date: {new Date(agency.timestamp || '').toLocaleDateString()}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mt-1">Logged via {agency.interactionType}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl flex items-center text-slate-500">
                        <CheckCircle2 size={16} className="mr-2 opacity-50" />
                        <span className="text-sm font-medium text-slate-500">No oversight agencies (such as DBI or DPH) have been explicitly notified according to the audit trail.</span>
                    </div>
                )}
            </div>

            {/* Rent Credits Calculator (Hidden from Legal Counsel) */}
            {user.role !== 'legal_counsel' && (
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <RentCalculator issue={issue} tenant={tenant || user} interactions={interactionLogs} />
                </div>
            )}

        </div>
    );
};

export default LegalIssueDetail;
