import React, { useState } from 'react';
import { Issue, InteractionLogEntry } from '../types';
import { Copy, Check, ExternalLink, Mail, Building, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface AgencySubmissionProps {
    issue: Issue;
    interactions: InteractionLogEntry[];
    evidenceFiles: any[]; // Using any to accommodate the Supabase response type containing metadata
    tenantName: string;
    tenantUnit: string;
    onClose: () => void;
}

const AgencySubmission: React.FC<AgencySubmissionProps> = ({ issue, interactions, evidenceFiles, tenantName, tenantUnit, onClose }) => {
    const [copiedContent, setCopiedContent] = useState<string | null>(null);

    // 1. Determine Oversight Body & Routing
    // We look up the sub-issue to find the precise oversight body.
    let targetAgency = issue.rule?.oversight_body || "DBI";
    let agencyName = "Dept. of Building Inspection (DBI)";
    let agencyEmail = "dbi.cypdd@sfgov.org"; // Example/placeholder generic emails
    let agencyPortalURL = "https://dbiweb02.sfgov.org/dbi_complaints/default.aspx?page=AddressQuery";
    let citation = issue.rule?.legal_citation || "";

    const categoryStr = Array.isArray(issue.category) ? issue.category[0] : issue.category;

    // Map agency acronyms to full details
    if (targetAgency === 'DPH') {
        agencyName = "Dept. of Public Health (DPH)";
        agencyEmail = "dph.eh@sfdph.org";
        agencyPortalURL = "https://www.sf.gov/report-building-problem";
    } else if (targetAgency === 'SFFD') {
        agencyName = "SF Fire Department (SFFD)";
        agencyEmail = "sffd.fireprevention@sfgov.org";
        agencyPortalURL = "https://forms.office.com/pages/responsepage.aspx?id=z8LVIj7OPUSaf9_MAjH3P2ZPhRo83N1Hii3hSPUqiohUNURXWDVVSzFOTkdKMzZIQTZCMDNZV1hXNSQlQCN0PWcu&route=shorturl";
    } else if (targetAgency === 'SF Rent Board') {
        agencyName = "San Francisco Rent Board";
        agencyEmail = "rentboard@sfgov.org";
        agencyPortalURL = "https://sfrb.org/";
    }

    // 2. Harassment Data
    const harassmentCount = interactions.filter(i => {
        const anyI = i as any;
        return anyI.vibe === 'hostile' || anyI.vibe === 'illegal_entry' ||
        ['Aggressive/Hostile', 'Illegal Entry/Visitor Denied'].some(tag => 
            Array.isArray(anyI.topic) ? anyI.topic.includes(tag) : (anyI.interactionCategory as any)?.includes(tag)
        )
    }).length;

    // 3. Evidence Processing (Only items with EXIF or that are flagged verifiable)
    // For this prototype, we'll list all evidence files but highlight the ones with EXIF.
    const verifiableEvidence = evidenceFiles.filter(f => f.metadata && (f.metadata.latitude || f.metadata.timestamp));

    // 4. Content Generation
    const generatePayload = () => {
        const reportedDate = new Date(issue.dateStarted).toLocaleDateString();
        
        return `FORMAL HABITABILITY COMPLAINT

TENANT INFORMATION:
Name: ${tenantName}
Unit: ${tenantUnit}

ISSUE DETAILS:
Issue Category: ${categoryStr?.split(':')[0] || 'Habitability Issue'}
Original Report Date: ${reportedDate}
Description: ${issue.description}
${citation ? `Legal Citation: ${citation}` : ''}

LANDLORD RESPONSE/INTERACTIONS:
Total Interaction Logs: ${interactions.length}
${harassmentCount > 0 ? `WARNING: ${harassmentCount} incident(s) of targeted harassment or illegal entry logged. Potential violation of SF Admin Code 37.10B.` : ''}

VERIFIABLE EVIDENCE (${verifiableEvidence.length} items attached):
${verifiableEvidence.map((f, i) => {
    let locStr = 'No GPS';
    if (f.metadata?.latitude && f.metadata?.longitude) {
        locStr = `${f.metadata.latitude.toFixed(6)}, ${f.metadata.longitude.toFixed(6)}`;
    }
    return `Evidence #${i + 1}: ${f.file_path}\n   Timestamp: ${f.metadata?.timestamp || 'Unknown'}\n   GPS: ${locStr}`;
}).join('\n\n')}

ATTESTATION:
I certify under penalty of perjury that the above information is true and correct to the best of my knowledge.`;
    };

    const payloadText = generatePayload();

    const handleCopy = () => {
        navigator.clipboard.writeText(payloadText);
        setCopiedContent('payload');
        setTimeout(() => setCopiedContent(null), 2000);
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Habitability Complaint - Unit ${tenantUnit}`);
        const body = encodeURIComponent(payloadText);
        window.location.href = `mailto:${agencyEmail}?subject=${subject}&body=${body}`;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1e3a8a] to-blue-800 p-6 flex justify-between items-start text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">SF311 Portal integration</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Agency Escalation</h2>
                        <p className="text-blue-100 mt-1 max-w-md text-sm">Review packaged complaint details before submitting to the target oversight agency.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors relative z-10 backdrop-blur-sm">
                        <X size={20} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: The Dashboard Stats */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Agency</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <Building className="text-blue-600 mb-2" size={24} />
                                <h3 className="font-bold text-slate-800 tracking-tight">{agencyName}</h3>
                                {citation && <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-200 inline-block px-1 rounded">{citation}</p>}
                            </div>
                        </div>

                        {harassmentCount > 0 && (
                            <div>
                                <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Treble Damages Alert</label>
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                                    <AlertTriangle className="text-rose-600 mb-2" size={24} />
                                    <h3 className="font-bold text-rose-800 tracking-tight">{harassmentCount} Harassment Log(s)</h3>
                                    <p className="text-xs text-rose-600 mt-1 font-medium">Included in agency report package.</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Evidence Vault</label>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <ShieldCheck className="text-emerald-600 mb-2" size={24} />
                                <h3 className="font-bold text-emerald-800 tracking-tight">{verifiableEvidence.length} Verifiable Files</h3>
                                <p className="text-xs text-emerald-600 mt-1 font-medium">GPS & Timestamp extracted.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The Payload */}
                    <div className="md:col-span-2 flex flex-col h-full">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                            <span>Generated Complaint Payload</span>
                            <span className="text-slate-400 text-[10px] font-normal font-mono px-2 py-0.5 bg-slate-100 rounded">JSON / TXT Ready</span>
                        </label>
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[10px] sm:text-xs text-slate-600 leading-relaxed overflow-y-auto whitespace-pre-wrap shadow-inner relative">
                            {payloadText}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center">
                    <p className="text-xs text-slate-500 italic flex items-center">
                        <ShieldCheck size={14} className="mr-1.5 text-emerald-500" />
                        Data secured and packaged locally.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleCopy}
                            className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center"
                        >
                            {copiedContent === 'payload' ? <Check size={16} className="mr-2 text-green-500" /> : <Copy size={16} className="mr-2" />}
                            Copy Text
                        </button>
                        
                        <a
                            href={agencyPortalURL}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors shadow-md flex items-center"
                        >
                            <ExternalLink size={16} className="mr-2 text-slate-300" />
                            Open {targetAgency} Portal
                        </a>
                        
                        <button
                            onClick={handleEmail}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md flex items-center"
                        >
                            <Mail size={16} className="mr-2" />
                            Draft Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencySubmission;
