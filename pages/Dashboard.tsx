import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import IssueForm from '../components/IssueForm';
import InteractionForm from '../components/InteractionForm';
import LegalDecoderDrawer from '../components/LegalDecoderDrawer';
import LegalNoticeBuilder from '../components/LegalNoticeBuilder';
import TaskForm from '../components/TaskForm';
import HistoricalDataForm from '../components/HistoricalDataForm';
import RepairCountdown from '../components/RepairCountdown';
import { IssueStatus } from '../types';

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

const Dashboard: React.FC = () => {
    const { issues, setIssues, user, interactionLogs, setInteractionLogs, notifications, todos, setTodos } = useApp();
    const navigate = useNavigate();
    const [showQuickRecordModal, setShowQuickRecordModal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showNewIssue, setShowNewIssue] = useState(false);
    const [todoTab, setTodoTab] = useState('Today');
    const [decoderOpen, setDecoderOpen] = useState(false);
    const [showLegalNoticeBuilder, setShowLegalNoticeBuilder] = useState(false);
    const [showNewTask, setShowNewTask] = useState(false);
    const [showHistoricalForm, setShowHistoricalForm] = useState(false);
    const [autoSelectIncidentId, setAutoSelectIncidentId] = useState<string>('');
    const [autoSelectNoticeType, setAutoSelectNoticeType] = useState<string>('');
    const [overdueIssueIds, setOverdueIssueIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchEscalationQueue = async () => {
            try {
                const { data, error } = await supabase
                    .from('issue_escalations')
                    .select('issue_id');

                if (error) throw error;
                const ids = new Set((data || []).map((row: any) => row.issue_id));
                setOverdueIssueIds(ids);
            } catch (err) {
                console.error("Error fetching escalation queue:", err);
            }
        };

        fetchEscalationQueue();
    }, []);

    const createEscalationTask = async (issueId: string, category: string) => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    tenant_id: user.id,
                    issue_id: issueId,
                    description: `Escalate issue: ${category}`,
                    status: 'to_do',
                    completed: false,
                    due_date: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newTodo = {
                    id: data.id,
                    task: data.description,
                    tenantUID: data.tenant_id,
                    relatedIssueId: data.issue_id,
                    date: data.created_at,
                    status: 'To-Do' as any,
                    completed: false,
                    deadline: data.due_date
                };
                setTodos(prev => [newTodo, ...prev]);
            }
        } catch (err) {
            console.error("Failed to create escalation task:", err);
        }
    };

    useEffect(() => {
        if (overdueIssueIds.size > 0 && issues.length > 0) {
            overdueIssueIds.forEach(issueId => {
                const issue = issues.find(i => i.id === issueId);
                if (issue && issue.status !== 'Resolved') {
                    const hasTask = todos.some(t => t.relatedIssueId === issueId && t.task.startsWith('Escalate issue'));
                    if (!hasTask) {
                        createEscalationTask(issueId, Array.isArray(issue.category) ? issue.category.join('/') : issue.category);
                    }
                }
            });
        }
    }, [overdueIssueIds, todos, issues]);



    const filteredNotifications = notifications.filter(n => !n.read).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const filteredIssues = issues.filter(i => i.status !== 'Resolved').sort((a, b) => new Date(b.dateStarted).getTime() - new Date(a.dateStarted).getTime());

    // Filter todos: exclude those linked to resolved issues
    const filteredTodos = todos.filter(todo => {
        if (!todo.relatedIssueId) return true;
        const relatedIssue = issues.find(i => i.id === todo.relatedIssueId);
        return !relatedIssue || relatedIssue.status !== 'Resolved';
    });

    const handleReportSuccess = (newIncidentId: string, wantsLegalNotice: boolean) => {
        setShowNewIssue(false); // Close Report Form
        if (wantsLegalNotice) {
            setAutoSelectIncidentId(newIncidentId); // Pre-select the new issue
            setAutoSelectNoticeType('repair_demand_notice'); // Default for new reports
            setShowLegalNoticeBuilder(true); // Open Legal Builder
        }
    };

    const handleAddIssue = (issue: any) => {
        const newIssue = {
            ...issue,
            id: issue.id || Date.now().toString(),
            status: 'Reported' as IssueStatus,
            dateStarted: issue.dateStarted || new Date().toISOString(),
            daysSinceReported: 0,
            evidence: [],
            escalationLevel: 0
        };
        setIssues([newIssue, ...issues]);
    };

    const handleAddTask = (task: any) => {
        const newTodo = {
            id: task.id,
            task: task.description,
            tenantUID: task.tenant_id,
            date: task.created_at,
            status: 'To-Do' as any,
            completed: false,
            deadline: task.due_date,
            end_date: task.end_date,
            start_time: task.start_time,
            end_time: task.end_time,
            meeting_link: task.meeting_link,
            location: task.location
        };
        setTodos([newTodo, ...todos]);
    };

    const toggleTodo = async (id: string) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        const newCompleted = !todo.completed;
        const newStatus = newCompleted ? 'Done' : 'To-Do';

        // 1. Optimistic Update
        setTodos(todos.map(t => t.id === id ? { ...t, completed: newCompleted, status: newStatus as any } : t));

        try {
            // 2. Persist to Supabase
            const { error: sbError } = await supabase
                .from('tasks')
                .update({
                    completed: newCompleted,
                    status: newStatus.toLowerCase().replace('-', '_')
                })
                .eq('id', id);

            if (sbError) throw sbError;
        } catch (error) {
            console.error("Error updating task in Supabase:", error);
            // 3. Rollback on failure (optional but recommended for better UX)
            setTodos(todos.map(t => t.id === id ? todo : t));
            alert("Failed to update task. Please try again.");
        }
    };

    // ... existing code ...

    const handleQuickRecord = () => {
        if (!isRecording) {
            setIsRecording(true);
        } else {
            setIsRecording(false);
            setShowQuickRecordModal(true);
        }
    };

    const handleSaveQuickRecord = async (log: any) => {
        const newLog = {
            id: 'log_' + Date.now().toString(),
            ...log
        };
        setInteractionLogs([newLog, ...interactionLogs]);
        setShowQuickRecordModal(false);

        try {
            const { error: sbError } = await supabase
                .from('interactions')
                .insert({
                    tenant_id: user.id,
                    staff_name: log.staffName,
                    staff_role: log.staffTitle,
                    interaction_type: toInteractionTypeValue(log.interactionType),
                    topic: toTopicArray(log.interactionCategory),
                    detailed_notes: log.detailedNotes,
                    promise_made: log.promiseMadeStatus === 'Yes',
                    promise_details: log.promiseMadeDetails,
                    follow_up_date: log.expectedFollowUpDates || null,
                    summary: log.summary,
                    issue_id: log.relatedIssueId || null,
                    created_at: log.timestamp ? new Date(log.timestamp).toISOString() : undefined
                });

            if (sbError) throw sbError;
        } catch (error) {
            console.error("Failed to persist interaction log:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-[#1e3a8a] to-blue-700 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black mb-2">Welcome, {user.name.split(' ')[0]} 👋</h1>
                    <p className="text-blue-100 font-semibold">Unit {user.unit}</p>
                </div>
            </div>

            {/* Quick Action Grid - Secondary Navigation */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => navigate('/calendar')}
                    className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all active:scale-95 group text-center"
                >
                    <i className="fa-solid fa-calendar-days text-2xl text-emerald-600 mb-2 group-hover:scale-110 transition-transform"></i>
                    <p className="text-xs font-bold text-slate-700">Calendar</p>
                </button>

                <button
                    onClick={() => setShowLegalNoticeBuilder(true)}
                    className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all active:scale-95 group text-center"
                >
                    <i className="fa-solid fa-gavel text-2xl text-indigo-600 mb-2 group-hover:scale-110 transition-transform"></i>
                    <p className="text-[10px] font-bold text-slate-700 leading-tight">Legal Notice Builder/<br/>Report to Oversight Agency</p>
                </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => setShowNewIssue(true)} className="bg-[#1e3a8a] text-white p-4 rounded-[24px] shadow-lg hover:bg-blue-900 transition-all active:scale-[0.98] group relative overflow-hidden flex flex-col justify-between h-32">
                    {/* ... Report Issue content ... */}
                    <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-triangle-exclamation text-6xl"></i>
                    </div>
                    <div className="relative z-10 text-left">
                        <i className="fa-solid fa-circle-plus text-2xl mb-2"></i>
                        <div>
                            <h3 className="text-lg font-black leading-tight">Report Issue</h3>
                            <p className="text-blue-200 font-bold text-[10px] uppercase tracking-widest mt-1">Incident Report</p>
                        </div>
                    </div>
                </button>

                <button onClick={handleQuickRecord} className={`${isRecording ? 'bg-red-600 animate-pulse' : 'bg-[#EF4444]'} text-white p-4 rounded-[24px] shadow-lg hover:bg-red-600 transition-all active:scale-[0.98] group relative overflow-hidden flex flex-col justify-between h-32`}>
                    <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-microphone-lines text-6xl"></i>
                    </div>
                    <div className="relative z-10 text-left">
                        <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-bolt'} text-2xl mb-2 text-white`}></i>
                        <div>
                            <h3 className="text-lg font-black leading-tight">{isRecording ? 'Stop Recording' : 'Quick Record'}</h3>
                            <p className="text-white/80 font-bold text-[10px] uppercase tracking-widest mt-1">{isRecording ? 'Tap to Save' : 'Log Entry'}</p>
                        </div>
                    </div>
                </button>

                <button onClick={() => navigate('/comms')} className="bg-white border-2 border-[#1e3a8a] text-[#1e3a8a] p-4 rounded-[24px] shadow-lg hover:bg-blue-50 transition-all active:scale-[0.98] group relative overflow-hidden flex flex-col justify-between h-32">
                    {/* ... Staff Interaction content ... */}
                    <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-user-tie text-6xl"></i>
                    </div>
                    <div className="relative z-10 text-left">
                        <i className="fa-solid fa-user-shield text-2xl mb-2"></i>
                        <div>
                            <h3 className="text-lg font-black leading-tight">Staff Interaction</h3>
                            <p className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mt-1">Audit Trail</p>
                        </div>
                    </div>
                </button>

                <button onClick={() => setShowHistoricalForm(true)} className="bg-amber-100 border-2 border-amber-500 text-amber-900 p-4 rounded-[24px] shadow-lg hover:bg-amber-200 transition-all active:scale-[0.98] group relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-clock-rotate-left text-6xl"></i>
                    </div>
                    <div className="relative z-10 text-left">
                        <i className="fa-solid fa-book-journal-whills text-2xl mb-2"></i>
                        <div>
                            <h3 className="text-lg font-black leading-tight text-amber-900">Log Past Event</h3>
                            <p className="text-amber-700 font-bold text-[10px] uppercase tracking-widest mt-1">Historical Record</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* 5. Data Tables */}
            <div className="grid grid-cols-1 gap-12 pt-8">

                {/* Notifications Table */}
                <div className="bg-white rounded-[40px] shadow-xl border border-slate-50 overflow-hidden">
                    {/* ... existing notifications table ... */}
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-rose-50/30">
                        <div className="flex items-center space-x-3 text-rose-600">
                            <i className="fa-solid fa-bell text-xl"></i>
                            <h2 className="text-xl font-black uppercase tracking-tight">Priority Notifications</h2>
                        </div>
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Today's Radar</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                    <th className="px-8 py-5">Urgency</th>
                                    <th className="px-8 py-5">Purpose</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Sender</th>
                                    <th className="px-8 py-5">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNotifications.map(n => (
                                    <tr key={n.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-50 last:border-0" onClick={() => alert(`Details for ${n.title}`)}>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${n.urgency === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {n.urgency}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-800 text-sm mb-1">{n.title}</p>
                                            <p className="text-xs text-slate-400 font-medium">{n.purpose}</p>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(n.timestamp).toLocaleDateString()}</td>
                                        <td className="px-8 py-6 text-sm font-black text-slate-700 underline decoration-slate-200 underline-offset-4">{n.sender}</td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase italic">{n.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Incident Log Table */}
                <div className="bg-white rounded-[40px] shadow-xl border border-slate-50 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
                        <div className="flex items-center space-x-3 text-indigo-600">
                            <i className="fa-solid fa-shield-halved text-xl"></i>
                            <h2 className="text-xl font-black uppercase tracking-tight">Critical Incident Log</h2>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending & Due (7 Days)</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                    <th className="px-8 py-5">Current Status</th>
                                    <th className="px-8 py-5">Description</th>
                                    <th className="px-8 py-5">Tenants Last Action</th>
                                    <th className="px-8 py-5">Next Expected Action</th>
                                    <th className="px-8 py-5">Countdown Timer</th>
                                    <th className="px-8 py-5">Deadline</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIssues.slice(0, 5).map(iss => {
                                    const isOverdue = overdueIssueIds.has(iss.id);
                                    return (
                                        <tr
                                            key={iss.id}
                                            className="group hover:bg-indigo-50/20 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                                            onClick={() => navigate(`/issues/${iss.id}`)}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col space-y-2">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {isOverdue ? 'Deadline Expired — Escalation Ready' : iss.status}
                                                    </span>
                                                    {isOverdue && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAutoSelectIncidentId(iss.id);
                                                                setAutoSelectNoticeType('repair_demand_notice');
                                                                setShowLegalNoticeBuilder(true);
                                                            }}
                                                            className="text-[10px] font-black text-white bg-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors uppercase tracking-widest shadow-sm"
                                                        >
                                                            Generate Escalation Notice
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="font-black text-slate-800 text-sm mb-1 truncate max-w-xs">{iss.description}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{Array.isArray(iss.category) ? iss.category.join(' / ') : iss.category}</p>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-medium text-slate-500 italic">"{iss.lastAction || 'Initial Report Filed'}"</td>
                                            <td className="px-8 py-6 text-sm font-black text-indigo-600 underline underline-offset-4">
                                                {iss.status === 'Resolved' ? 'Resolved' 
                                                 : iss.escalationLevel >= 2 ? 'Agency Review Pending'
                                                 : iss.escalationLevel === 1 && isOverdue ? 'Ready for Oversight'
                                                 : iss.escalationLevel === 1 ? 'Awaiting 24h window'
                                                 : isOverdue ? 'Ready for X+1 Warning'
                                                 : 'Awaiting Repair/Inspection'}
                                            </td>
                                            <td className="px-8 py-6">
                                                <RepairCountdown issueId={iss.id} deadline={iss.repairDeadline} issueStatus={iss.status} />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-center bg-slate-50 rounded-2xl p-2 border border-slate-100 group-hover:bg-white">
                                                    <p className="text-xs font-black text-slate-800">{iss.deadline ? new Date(iss.deadline).toLocaleDateString() : 'No Deadline'}</p>
                                                    <p className="text-[8px] text-rose-500 font-bold uppercase tracking-tighter">Due Date</p>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* To-Do List Table (Today's Agenda) - Kept as is */}
                <div className="bg-white rounded-[40px] shadow-xl border border-slate-50 overflow-hidden mb-20">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-emerald-50/30 gap-4">
                        <div className="flex items-center space-x-3 text-emerald-600">
                            <i className="fa-solid fa-list-check text-xl"></i>
                            <h2 className="text-xl font-black uppercase tracking-tight">Today's Agenda</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowNewTask(true)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-100"
                            >
                                <i className="fa-solid fa-circle-plus"></i>
                                <span>Create Task</span>
                            </button>
                            <div className="flex bg-white/50 p-1 rounded-2xl border border-emerald-100 shadow-inner">
                                {['Today', 'This Week', 'This Month'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setTodoTab(tab)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${todoTab === tab ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-600 hover:bg-emerald-100'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                    <th className="px-8 py-5 w-20 text-center">Done</th>
                                    <th className="px-8 py-5">Task</th>
                                    <th className="px-8 py-5">Deadline</th>
                                    <th className="px-8 py-5">Internal Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTodos.map(todo => (
                                    <tr key={todo.id} className={`group hover:bg-emerald-50/20 transition-colors border-b border-slate-50 last:border-0 ${todo.completed ? 'opacity-50' : ''}`}>
                                        <td className="px-8 py-6 text-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }}
                                                className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:border-emerald-500'}`}
                                            >
                                                {todo.completed && <i className="fa-solid fa-check text-sm font-black"></i>}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => todo.relatedIssueId ? navigate(`/issue/${todo.relatedIssueId}`) : undefined}>
                                            <p className={`font-black text-slate-800 text-sm ${todo.completed ? 'line-through decoration-emerald-500 decoration-2' : ''}`}>{todo.task}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{todo.status}</p>
                                        </td>
                                        <td className="px-8 py-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => todo.relatedIssueId ? navigate(`/issue/${todo.relatedIssueId}`) : undefined}>
                                            <div className="flex items-center space-x-2 text-rose-600">
                                                <i className="fa-regular fa-clock text-xs"></i>
                                                <span className="text-sm font-black italic">{todo.deadline ? new Date(todo.deadline).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs text-slate-400 font-medium max-w-xs truncate italic">
                                            {todo.notes || 'No notes added'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>



            </div>

            {/* Existing Overlays/Forms */}
            {showNewIssue && <IssueForm isOpen={showNewIssue} onClose={() => setShowNewIssue(false)} onSubmit={handleAddIssue} onSuccess={handleReportSuccess} />}
            {showNewTask && <TaskForm isOpen={showNewTask} onClose={() => setShowNewTask(false)} onSuccess={handleAddTask} />}

            {showHistoricalForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm -z-10" onClick={() => setShowHistoricalForm(false)}></div>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative bg-transparent">
                         <div className="bg-white rounded-t-2xl p-4 flex justify-end">
                              <button onClick={() => setShowHistoricalForm(false)} className="text-gray-500"><i className="fa-solid fa-xmark text-xl"></i></button>
                         </div>
                         <HistoricalDataForm 
                             onAddEntry={(entry) => {
                                 handleAddIssue(entry);
                                 setShowHistoricalForm(false);
                             }} 
                             directSubmitToSupabase={true} 
                         />
                    </div>
                </div>
            )}

            {showQuickRecordModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm -z-10" onClick={() => setShowQuickRecordModal(false)}></div>
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-2xl font-bold text-slate-800">Complete Recording Entry</h3>
                                <button onClick={() => setShowQuickRecordModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <i className="fa-solid fa-xmark text-xl"></i>
                                </button>
                            </div>
                            <InteractionForm
                                onSubmit={handleSaveQuickRecord}
                                onCancel={() => setShowQuickRecordModal(false)}
                                currentTenantId={user.id || user.name}
                                availableIssues={issues} // Pass all issues for now, or filteredIssues if preferred
                                initialData={{
                                    detailedNotes: '[Audio Recording Attempted - File Upload Pending System Setup]',
                                    interactionType: 'In-Person',
                                    interactionCategory: [],
                                    promiseMadeStatus: 'No',
                                    promiseMadeDetails: '',
                                    relatedIssueId: ''
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showLegalNoticeBuilder && (
                <LegalNoticeBuilder
                    onClose={() => setShowLegalNoticeBuilder(false)}
                    initialIncidentId={autoSelectIncidentId}
                    initialNoticeType={autoSelectNoticeType}
                />
            )}
            <LegalDecoderDrawer isOpen={decoderOpen} onClose={() => setDecoderOpen(false)} />
        </div>
    );
};

export default Dashboard;
