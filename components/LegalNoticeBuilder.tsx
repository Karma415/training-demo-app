import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { jsPDF } from "jspdf";
import { supabase } from '../services/supabase';

// Import raw templates via Vite
import initialNoticeText from '../templates/initial_notice_of_substandard_condition.md?raw';
import escalationNoticeText from '../templates/escalation_notice_pre_city_action.md?raw';
import visitorNoticeText from '../templates/visitor_policy_violation_notice.md?raw';
import agencyNoticeText from '../templates/agency_report_substandard_conditions.md?raw';
import { ISSUE_CATEGORIES } from '../src/config/issueCategories';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

interface LegalNoticeBuilderProps {
    onClose: () => void;
    initialIncidentId?: string;
    initialNoticeType?: string;
}

const parseTemplateVariables = (template: string, data: Record<string, string>) => {
    // Basic extraction of everything below ---
    const bodyStart = template.indexOf('---');
    let body = bodyStart !== -1 ? template.substring(bodyStart + 3).trim() : template;
    
    // Replace {{variables}}
    return body.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        return data[key.trim()] || `[${key.trim().toUpperCase()}]`;
    });
};

const LegalNoticeBuilder: React.FC<LegalNoticeBuilderProps> = ({ onClose, initialIncidentId }) => {
    const { user, issues, interactionLogs, setInteractionLogs } = useApp();
    const [step, setStep] = useState(initialIncidentId ? 2 : 1);
    
    const [selectedIssueId, setSelectedIssueId] = useState<string>(initialIncidentId || (issues?.find((i: any) => i.status !== 'Resolved')?.id) || '');
    
    // Fallback to first open issue if not
    const activeIssue = issues?.find((i: any) => i.id === selectedIssueId);
    
    const [actionType, setActionType] = useState<'initial' | 'escalation' | 'agency' | 'visitor'>('initial');
    const [experiencedRetaliation, setExperiencedRetaliation] = useState<boolean | null>(null);
    const [includeCeaseAndDesist, setIncludeCeaseAndDesist] = useState<boolean>(false);
    
    // Visitor-specific fields
    const [guestName, setGuestName] = useState('');
    const [staffName, setStaffName] = useState('');
    const [denialReason, setDenialReason] = useState('');
    
    const [otherDescription, setOtherDescription] = useState('');
    const [aiOptions, setAiOptions] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const issueName = selectedIssueId === 'other' ? 'Other/General Situation' : (activeIssue ? (Array.isArray(activeIssue.category) ? activeIssue.category[0] : activeIssue.category) : 'Issue');

    // Auto-detect if retaliation checks are needed
    useEffect(() => {
        if (activeIssue && interactionLogs) {
            const issueLogs = interactionLogs.filter((log: any) => log.relatedIssueId === activeIssue.id);
            const hasHostility = issueLogs.some((log: any) => 
                log.summary?.toLowerCase().includes('hostil') || 
                log.summary?.toLowerCase().includes('harass') ||
                log.detailed_notes?.toLowerCase().includes('retaliat') ||
                // Assuming 'Aggressive/Hostile' or 'Illegal Entry' might be recorded in interaction metadata or summary
                log.summary?.includes('Aggressive') || log.summary?.includes('Illegal')
            );
            if (hasHostility) {
                setExperiencedRetaliation(true); // Auto-flag
            }
        }
    }, [activeIssue, interactionLogs]);

    const handleAskAi = async () => {
        if (!otherDescription.trim()) return;
        setIsAiLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `You are a helpful tenant rights assistant for a San Francisco tenant. 
The tenant has an issue they described as: "${otherDescription}"
Please provide 3-4 bullet points of practical, legal, or administrative options they can take regarding this situation based on San Francisco tenant laws and general best practices. Keep it concise, empathetic, and actionable. Do not use markdown asterisks.`;
            const result = await model.generateContent(prompt);
            setAiOptions(result.response.text());
        } catch (error) {
            console.error("AI Generation Error", error);
            setAiOptions("Failed to get suggestions. Please check your connection or try again later.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const generatePreview = () => {
        if (!activeIssue) return;
        
        const tenantName = user?.name || 'Tenant';
        const unitNumber = user?.unit || '[UNIT]';
        const date = new Date().toLocaleDateString();
        
        let templateToUse = actionType === 'initial' ? initialNoticeText 
                          : actionType === 'escalation' ? escalationNoticeText 
                          : actionType === 'agency' ? agencyNoticeText 
                          : visitorNoticeText;
        
        // Ensure TS ignores missing fields when constructing variables
        const activeIssueAny = activeIssue as any;

        let dynamicLegalCitation = "San Francisco Housing Code";
        if (activeIssueAny.rule_id) {
            const subIssue = ISSUE_CATEGORIES.flatMap(c => c.subIssues).find(s => s.id === activeIssueAny.rule_id);
            if (subIssue && subIssue.legalCitation) {
                dynamicLegalCitation = subIssue.legalCitation;
            }
        }
        
        // Strip out the [HISTORICAL ENTRY] caveat so it doesn't show up in legal letters
        const rawDescription = activeIssue.description || '';
        const cleanDescription = Math.abs(rawDescription.indexOf('[HISTORICAL ENTRY]')) !== -1 
            ? rawDescription.replace(/\[HISTORICAL ENTRY\] Information in this section was entered seven days or more after the event occurred\. It is separated because it may not be as accurate due to the time lapse between the event and logging the data\./g, '').trim()
            : rawDescription.trim();

        const dataMap: Record<string, string> = {
            date: date,
            manager_name: "Grace Wong (Building Manager)",
            organization_name: "Tenderloin Housing Clinic (THC)",
            tenant_name: tenantName,
            unit_number: unitNumber.toString(),
            primary_issue_name: issueName || 'Substandard Condition',
            issue: cleanDescription || issueName || '',
            problem_description: cleanDescription || issueName || '',
            legal_citation: dynamicLegalCitation,
            repair_timeline: activeIssueAny.repair_clock_hours ? (activeIssueAny.repair_clock_hours >= 48 ? `${Math.floor(activeIssueAny.repair_clock_hours / 24)} Days` : `${activeIssueAny.repair_clock_hours} Hours`) : "a reasonable timeframe",
            legal_timeline: activeIssueAny.repair_clock_hours ? (activeIssueAny.repair_clock_hours >= 48 ? `${Math.floor(activeIssueAny.repair_clock_hours / 24)} Days` : `${activeIssueAny.repair_clock_hours} Hours`) : "a reasonable timeframe",
            original_notice_date: activeIssue.dateStarted ? new Date(activeIssue.dateStarted).toLocaleDateString() : (activeIssueAny.created_at ? new Date(activeIssueAny.created_at).toLocaleDateString() : '[Date of Original Request]'),
            current_date: date,
            deadline_date: new Date(Date.now() + 86400000).toLocaleDateString(), // Tomorrow
            deadline_time: "5:00 PM",
            oversight_agency: activeIssueAny.oversight_body || "Department of Building Inspection (DBI)",
            guest_name: guestName || "[NAME OF GUEST]",
            staff_name: staffName || "[NAME OF STAFF]",
            denial_reason_provided: denialReason || "[REASON NOT SPECIFIED]",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            phone_number: user?.phone || "[PHONE NUMBER]"
        };

        let parsedBody = parseTemplateVariables(templateToUse, dataMap);
        
        // Inject retaliation clause if requested
        if (includeCeaseAndDesist || experiencedRetaliation) {
            const harassmentClause = `\n\n**Cease & Desist - Harassment / Retaliation Notice:**\nAdditionally, I am formally demanding that you cease any and all harassing behavior, intimidation, or unauthorized entry into my unit in retaliation for this complaint. Under California Civil Code § 1927 and San Francisco Administrative Code § 37.10B, such actions are strictly illegal and will be formally reported to the Rent Board for treble damages.\n\n`;
            
            // Inject before the "Sincerely" or end of the document
            if (parsedBody.includes("Sincerely,")) {
                parsedBody = parsedBody.replace("Sincerely,", harassmentClause + "Sincerely,");
            } else {
                parsedBody += harassmentClause;
            }
        }

        // Remove ALL asterisks globally from the generated letter to clean up markdown
        parsedBody = parsedBody.replace(/\*/g, '');

        setGeneratedLetter(parsedBody.trim());
        setStep(3);
    };

    const handlePreviewPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFont("times", "normal");
            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(generatedLetter, 180);
            doc.text(splitText, 15, 20);
            const pdfBlob = doc.output('bloburl');
            window.open(pdfBlob, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Could not generate PDF preview.");
        }
    };

    const handleSaveNotice = async () => {
        if (!activeIssue || !user) return;

        setIsSaving(true);
        try {
            await supabase.from('legal_notices').insert({
                tenant_id: user.id,
                issue_id: activeIssue.id,
                notice_type: actionType === 'initial' ? 'initial_notice' 
                           : actionType === 'escalation' ? 'escalation_notice'
                           : actionType === 'agency' ? 'agency_report' : 'visitor_notice',
                content: generatedLetter,
                sent_at: new Date().toISOString()
            });

            // Insert into interaction log to update timeline
            const { data: interactionData } = await supabase.from('interactions').insert({
                tenant_id: user.id,
                staff_name: 'Property Management',
                interaction_type: 'Written Document',
                topic: Array.isArray(activeIssue.category) ? activeIssue.category : [activeIssue.category],
                detailed_notes: `Legal Notice Generated & Escalated:\n\n${generatedLetter}`,
                summary: `Sent Notice: ${actionType.toUpperCase()}`,
                issue_id: activeIssue.id
            }).select().single();

            if (interactionData && setInteractionLogs) {
                const newLogEntry = {
                    id: interactionData.id,
                    tenantId: interactionData.tenant_id,
                    interactionType: interactionData.interaction_type,
                    staffName: interactionData.staff_name,
                    staffTitle: interactionData.staff_role,
                    summary: interactionData.summary,
                    detailedNotes: interactionData.detailed_notes,
                    interactionCategory: interactionData.interaction_category,
                    promiseMadeStatus: (interactionData.promise_made ? 'Yes' : 'No') as 'Yes' | 'No',
                    promiseMadeDetails: interactionData.promise_details,
                    expectedFollowUpDates: interactionData.follow_up_date,
                    relatedIssueId: interactionData.issue_id,
                    location: interactionData.location || 'Unknown',
                    timestamp: interactionData.created_at
                };
                setInteractionLogs([newLogEntry, ...interactionLogs]);
            }

            // The notice has been saved and logged in Supabase.

            alert("Notice saved successfully!");
            onClose();
        } catch (error) {
            console.error("Error saving notice:", error);
            alert("Failed to save notice. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (issues?.length === 0) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 shadow-2xl">
                    <p>No active issues found. Please create an issue first.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl p-4 sm:p-8 shadow-2xl relative mx-auto my-4 sm:my-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Legal Notice Builder</h2>
                        <p className="text-sm text-slate-400 font-medium mt-1">
                            {initialIncidentId ? 'Action Selection & Review' : `Step ${step} of 3 - ${issueName}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <i className="fa-solid fa-xmark text-2xl"></i>
                    </button>
                </div>

                <div className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <label className="block text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
                                    Which issue would you like to take action on?
                                </label>
                                
                                <div className="space-y-3">
                                    {issues?.filter((i: any) => i.status !== 'Resolved').map((issue: any) => (
                                        <label key={issue.id} className={["block relative p-4 rounded-xl border-2 cursor-pointer transition-all", selectedIssueId === issue.id ? 'border-blue-500 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'].join(' ')}>
                                            <div className="flex items-start gap-3">
                                                <input 
                                                    type="radio" 
                                                    value={issue.id}
                                                    checked={selectedIssueId === issue.id}
                                                    onChange={() => setSelectedIssueId(issue.id)}
                                                    className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                                                />
                                                <span className="font-bold text-slate-800 leading-tight">
                                                    {Array.isArray(issue.category) ? issue.category[0] : issue.category} - {new Date(issue.date_reported || issue.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                    
                                    <label className={["block relative p-4 rounded-xl border-2 cursor-pointer transition-all", selectedIssueId === 'other' ? 'border-blue-500 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'].join(' ')}>
                                        <div className="flex items-start gap-3">
                                            <input 
                                                type="radio" 
                                                value="other"
                                                checked={selectedIssueId === 'other'}
                                                onChange={() => setSelectedIssueId('other')}
                                                className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                                            />
                                            <span className="font-bold text-slate-800 leading-tight">Other / Write an explanation</span>
                                        </div>
                                    </label>
                                </div>

                                {selectedIssueId === 'other' && (
                                    <div className="mt-6 animate-in fade-in slide-in-from-top-4">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Explain your situation:</label>
                                        <textarea
                                            value={otherDescription}
                                            onChange={(e) => setOtherDescription(e.target.value)}
                                            placeholder="Write a short paragraph explaining the situation..."
                                            className="w-full h-32 p-4 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                        />
                                        <button 
                                            onClick={handleAskAi}
                                            disabled={isAiLoading || !otherDescription.trim()}
                                            className="mt-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isAiLoading ? 'Analyzing...' : 'Ask AI for Options'}
                                        </button>

                                        {aiOptions && (
                                            <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl whitespace-pre-wrap text-slate-800 text-sm font-medium leading-relaxed">
                                                {aiOptions}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    if (selectedIssueId === 'other') {
                                        // Stay here or close? If it's pure advice, there's no notice to build.
                                        alert("For 'Other' situations, please review the AI guidance above. To generate a formal notice, please select a specific tracked issue.");
                                    } else {
                                        setStep(2);
                                    }
                                }}
                                disabled={selectedIssueId === 'other'}
                                className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center text-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue to Action Selection <i className="fa-solid fa-arrow-right ml-3"></i>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Question 1: Action Selection */}
                            <div className="bg-blue-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-4">
                                    {!initialIncidentId && (
                                        <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                            <i className="fa-solid fa-arrow-left"></i>
                                        </button>
                                    )}
                                    <label className="block text-sm font-black text-blue-800 uppercase tracking-widest">
                                        What action would you like to take regarding your issue ({issueName})?
                                    </label>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Option A */}
                                    <label className={["block relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all", actionType === 'initial' ? 'border-blue-500 bg-white shadow-md' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'].join(' ')}>
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <input 
                                                type="radio" 
                                                name="actionType" 
                                                value="initial"
                                                checked={actionType === 'initial'}
                                                onChange={() => setActionType('initial')}
                                                className="w-5 h-5 text-blue-600 mt-0.5"
                                            />
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-base sm:text-lg">Create a written document to building management</h4>
                                                <p className="text-sm text-slate-600 font-medium">To formally request your {issueName.toLowerCase()} be fixed.</p>
                                                
                                                {actionType === 'initial' && (
                                                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100/50 text-xs sm:text-sm text-blue-800 leading-relaxed font-medium">
                                                        <span className="font-bold block mb-1">Why choose this option?</span>
                                                        Since you may have only made a verbal request to have your {issueName.toLowerCase()} fixed, it is a crucial legal step to put it in writing so you have undeniable proof. After creating this request, it's highly recommended to send it via certified mail, or use your phone's video recorder to document yourself handing the exact letter to your landlord.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* Option B */}
                                    <label className={["block relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all", actionType === 'escalation' ? 'border-amber-500 bg-white shadow-md' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'].join(' ')}>
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <input 
                                                type="radio" 
                                                name="actionType" 
                                                value="escalation"
                                                checked={actionType === 'escalation'}
                                                onChange={() => setActionType('escalation')}
                                                className="w-5 h-5 text-amber-600 mt-0.5"
                                            />
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-base sm:text-lg">Create the Final 'X + 1' Escalation Letter</h4>
                                                <p className="text-sm text-slate-600 font-medium">To issue a final statutory warning before bringing in the City.</p>
                                                
                                                {actionType === 'escalation' && (
                                                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-200/50 text-xs sm:text-sm text-amber-800 leading-relaxed font-medium">
                                                        <span className="font-bold block mb-1">Why choose this option?</span>
                                                        Since the time clock for this issue has run out, creating the X + 1 letter serves as your formal right to demand compliance as well as notifying oversight agencies like {(activeIssue as any)?.oversight_body || 'DBI'} and the SF Rent Board. However, to ensure everything stays strictly within the law, you must wait 24 hours after presenting this X+1 letter before actually submitting the formal agency complaint.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* Option C */}
                                    <label className={["block relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all", actionType === 'agency' ? 'border-indigo-500 bg-white shadow-md' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'].join(' ')}>
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <input 
                                                type="radio" 
                                                name="actionType" 
                                                value="agency"
                                                checked={actionType === 'agency'}
                                                onChange={() => setActionType('agency')}
                                                className="w-5 h-5 text-indigo-600 mt-0.5"
                                            />
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-base sm:text-lg">Report to Oversight Agency</h4>
                                                <p className="text-sm text-slate-600 font-medium">To document and officially report substandard conditions directly to agencies like DBI or DPH.</p>
                                                
                                                {actionType === 'agency' && (
                                                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-indigo-50 rounded-xl border border-indigo-200/50 text-xs sm:text-sm text-indigo-800 leading-relaxed font-medium">
                                                        <span className="font-bold block mb-1">Why choose this option?</span>
                                                        For filing an official complaint with an oversight agency. This generates a letter that you can mail directly to the agency if you prefer not to use their online forms.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* Option D */}
                                    <label className={["block relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all", actionType === 'visitor' ? 'border-emerald-500 bg-white shadow-md' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'].join(' ')}>
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <input 
                                                type="radio" 
                                                name="actionType" 
                                                value="visitor"
                                                checked={actionType === 'visitor'}
                                                onChange={() => setActionType('visitor')}
                                                className="w-5 h-5 text-emerald-600 mt-0.5"
                                            />
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-base sm:text-lg">Visitor Policy Violation Notice</h4>
                                                <p className="text-sm text-slate-600 font-medium">To formally demand management comply with legal visitor and guest policies under the SF Rent Ordinance.</p>
                                                
                                                {actionType === 'visitor' && (
                                                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200/50 space-y-4">
                                                        <div className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-medium">
                                                            <span className="font-bold block mb-1">Why choose this option?</span>
                                                            San Francisco tenants have a right to overnight guests. Use this to notify management that they are improperly restricting your visitors.
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-tighter mb-1">Guest's Full Name</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={guestName}
                                                                    onChange={(e) => setGuestName(e.target.value)}
                                                                    placeholder="e.g. John Doe"
                                                                    className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-tighter mb-1">Staff Member involved</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={staffName}
                                                                    onChange={(e) => setStaffName(e.target.value)}
                                                                    placeholder="e.g. Desk Clerk"
                                                                    className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                                <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-tighter mb-1">Reason provided for denial</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={denialReason}
                                                                    onChange={(e) => setDenialReason(e.target.value)}
                                                                    placeholder="e.g. 'Guest list was not updated'"
                                                                    className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Question 2: Retaliation Check */}
                            <div className="bg-rose-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-rose-100">
                                <label className="block text-sm font-black text-rose-800 uppercase tracking-widest mb-4">
                                    Retaliation & Harassment Check
                                </label>
                                
                                {experiencedRetaliation === null ? (
                                    <div className="space-y-3">
                                        <p className="text-slate-700 font-medium">Have you experienced any intimidation, retaliation, or harassment from management regarding this issue?</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setExperiencedRetaliation(true)} className="flex-1 py-3 bg-white border-2 border-slate-200 hover:border-rose-300 rounded-xl font-bold text-slate-700 transition-colors">Yes, I have</button>
                                            <button onClick={() => setExperiencedRetaliation(false)} className="flex-1 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 transition-colors">No, I have not</button>
                                        </div>
                                    </div>
                                ) : experiencedRetaliation === true ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-3 text-rose-600 bg-rose-100/50 p-3 rounded-xl font-bold">
                                            <i className="fa-solid fa-triangle-exclamation"></i>
                                            Retaliation Flagged
                                        </div>
                                        <p className="text-slate-700 font-medium">Since you have confirmed retaliation/harassment, would you like to automatically inject a formal **"Cease & Desist"** warning into this letter?</p>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setIncludeCeaseAndDesist(true)} 
                                                className={["flex-1 py-3 border-2 rounded-xl font-bold transition-all", includeCeaseAndDesist ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300'].join(' ')}
                                            >
                                                Yes, add Cease & Desist
                                            </button>
                                            <button 
                                                onClick={() => { setIncludeCeaseAndDesist(false); setExperiencedRetaliation(false); }} 
                                                className="flex-1 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 transition-colors"
                                            >
                                                No, remove it
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-500 bg-slate-100 p-3 rounded-xl font-medium">
                                        <i className="fa-solid fa-check"></i>
                                        No retaliation reported.
                                        <button onClick={() => setExperiencedRetaliation(null)} className="ml-auto underline text-xs">Change</button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={generatePreview}
                                className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 flex items-center justify-center text-lg mt-8"
                            >
                                Continue to Review Letter <i className="fa-solid fa-arrow-right ml-3"></i>
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                Formal Notice Preview
                                <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-1 rounded-md">Fully Editable</span>
                            </h3>

                            <textarea
                                className="w-full h-[300px] sm:h-[400px] p-4 sm:p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl sm:rounded-3xl font-mono text-[10px] sm:text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner"
                                value={generatedLetter}
                                onChange={(e) => setGeneratedLetter(e.target.value)}
                            />

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                                >
                                    <i className="fa-solid fa-arrow-left mr-2"></i>
                                    Back
                                </button>

                                <button
                                    onClick={handlePreviewPDF}
                                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200"
                                >
                                    <i className="fa-solid fa-print mr-2"></i>
                                    View / Print Notice
                                </button>

                                <button
                                    onClick={handleSaveNotice}
                                    disabled={isSaving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                                >
                                    <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-clipboard-check'} mr-2`}></i>
                                    {isSaving ? 'Saving...' : 'Save to Case File'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegalNoticeBuilder;
