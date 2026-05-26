import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Scale, Search, ArrowRight, FileText, AlertOctagon, Users, User as UserIcon, Building, ShieldCheck, BookOpen } from 'lucide-react';
import { Tenant } from '../types';
import { supabase } from '../services/supabase';
import AdminArticleEditor from '../components/AdminArticleEditor';
import Timeline from './Timeline';
import IssueHeatMap from '../components/IssueHeatMap';
import AdminFileCabinet from './AdminFileCabinet';
import AdminCommunications from '../components/AdminCommunications';
import ClientProfileDrawer from '../components/ClientProfileDrawer';
import { Eye } from 'lucide-react';

const LegalDashboard: React.FC = () => {
    const { issues, tenants, user } = useApp();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'aggregate' | 'individual' | 'editor' | 'timeline' | 'heatmap' | 'file-cabinet' | 'communications'>('aggregate');
    const [assignedClients, setAssignedClients] = useState<Tenant[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const [profileEmail, setProfileEmail] = useState<string | null>(null);
    const [profileName, setProfileName] = useState('');
    const [profileUnit, setProfileUnit] = useState<string | null>(null);

    // Fetch assigned clients explicitly 
    // (issues are already filtered by RLS in AppContext)
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const { data: assignments, error: assignError } = await supabase
                    .from('client_assignments')
                    .select('tenant_id')
                    .eq('attorney_id', user.supabaseId || user.id);
                
                if (assignError) throw assignError;

                if (assignments) {
                    const clientIds = assignments.map(a => a.tenant_id);
                    const clients = tenants.filter(t => clientIds.includes(t.id) || t.requestsAttorney);
                    setAssignedClients(clients);
                    
                    if (clients.length > 0 && !selectedClientId) {
                        setSelectedClientId(clients[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load assigned clients", err);
            }
        };

        if (user.role === 'legal_counsel') {
            fetchClients();
        }
    }, [user.id, tenants]);

    // Aggregate View: Show all issues for all assigned clients
    // Let attorneys see EVERYTHING assigned to them, not just escalated
    const aggregateIssues = issues.filter(issue => {
        const tenant = tenants.find(t => t.id === issue.tenantId);
        const searchTarget = `${tenant?.firstName} ${tenant?.lastName} ${tenant?.unit} ${issue.category}`.toLowerCase();
        return searchTarget.includes(searchQuery.toLowerCase());
    });

    // Individual View: Show issues for selected client
    const individualIssues = issues.filter(issue => {
        const isMatch = issue.tenantId === selectedClientId;
        const searchTarget = `${issue.category} ${issue.description}`.toLowerCase();
        return isMatch && searchTarget.includes(searchQuery.toLowerCase());
    });

    const displayIssues = viewMode === 'aggregate' ? aggregateIssues : individualIssues;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center">
                        <Scale className="w-8 h-8 mr-3 text-indigo-700" />
                        Attorney Dashboard
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage your assigned clients and review building-wide habitability records.</p>
                </div>
            </header>

            {/* View Mode Toggle */}
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 max-w-fit flex-wrap gap-1">
                <button
                    onClick={() => setViewMode('aggregate')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        viewMode === 'aggregate' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <Building className="w-4 h-4" />
                    All Issues Reported
                </button>
                <button
                    onClick={() => setViewMode('individual')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        viewMode === 'individual' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <UserIcon className="w-4 h-4" />
                    Individual Client View
                </button>
                <button
                    onClick={() => setViewMode('editor')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        viewMode === 'editor' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Manage Articles
                </button>
                <button
                    onClick={() => setViewMode('communications')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        viewMode === 'communications' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <i className="fa-solid fa-bullhorn w-4 h-4"></i>
                    Announcements
                </button>
                <button
                    onClick={() => setViewMode('timeline')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        viewMode === 'timeline' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <i className="fa-solid fa-timeline w-4 h-4"></i>
                    Exact Timeline
                </button>
                <button
                    onClick={() => setViewMode('heatmap')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        viewMode === 'heatmap' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <i className="fa-solid fa-map w-4 h-4"></i>
                    Building Heat Map
                </button>
                <button
                    onClick={() => setViewMode('file-cabinet')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        viewMode === 'file-cabinet' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <i className="fa-solid fa-folder-tree w-4 h-4"></i>
                    File Cabinet
                </button>
            </div>

            {viewMode === 'communications' ? (
                <AdminCommunications />
            ) : viewMode === 'editor' ? (
                <AdminArticleEditor />
            ) : viewMode === 'timeline' ? (
                <Timeline />
            ) : viewMode === 'heatmap' ? (
                <IssueHeatMap issues={issues} />
            ) : viewMode === 'file-cabinet' ? (
                <AdminFileCabinet />
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar for Individual View */}
                    {viewMode === 'individual' && (
                        <div className="w-full lg:w-1/3 space-y-4">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="font-bold text-slate-800 flex items-center">
                                        <Users className="w-5 h-5 mr-2 text-indigo-600" />
                                        My Clients
                                    </h2>
                                </div>
                                <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                                    {assignedClients.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-8">No clients assigned yet.</p>
                                    ) : (
                                        assignedClients.map(client => (
                                            <button
                                                key={client.id}
                                                onClick={() => setSelectedClientId(client.id)}
                                                className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group ${
                                                    selectedClientId === client.id 
                                                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' 
                                                        : 'bg-white border-slate-100 hover:border-indigo-300'
                                                }`}
                                            >
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{client.firstName} {client.lastName}</h3>
                                                    <p className="text-xs text-slate-500">Unit {client.unit} • {client.email}</p>
                                                </div>
                                                <div 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setProfileEmail(client.email || null);
                                                        setProfileName(client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown');
                                                        setProfileUnit(client.unit || null);
                                                        setIsProfileDrawerOpen(true);
                                                    }}
                                                    className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm transition-all"
                                                    title="View Intake Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Issues Table */}
                    <div className={`w-full ${viewMode === 'individual' ? 'lg:w-2/3' : ''}`}>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                {viewMode === 'aggregate' ? (
                                    <><AlertOctagon className="w-5 h-5 mr-2 text-indigo-600" /> Building-Wide Case Feed ({displayIssues.length})</>
                                ) : (
                                    <><FileText className="w-5 h-5 mr-2 text-indigo-600" /> Client Records ({displayIssues.length})</>
                                )}
                            </h2>
                            <div className="relative w-full sm:w-auto">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder={viewMode === 'aggregate' ? "Search all records..." : "Search client records..."}
                                    className="w-full sm:w-72 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider font-black text-slate-500">
                                    <tr>
                                        {viewMode === 'aggregate' && <th className="px-6 py-4">Tenant / Unit</th>}
                                        <th className="px-6 py-4">Violation Details</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Oversight Body</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                                    {displayIssues.length === 0 ? (
                                        <tr>
                                            <td colSpan={viewMode === 'aggregate' ? 5 : 4} className="px-6 py-16 text-center text-slate-400">
                                                <AlertOctagon className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                                <p>No records found matching your criteria.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        displayIssues.map(issue => {
                                            const tenant = tenants.find(t => t.id === issue.tenantId);
                                            const isEscalated = issue.escalationLevel > 0;
                                            
                                            return (
                                                <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                                                    {viewMode === 'aggregate' && (
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-slate-800">{tenant?.firstName} {tenant?.lastName}</p>
                                                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest">
                                                                Unit {tenant?.unit}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 max-w-[250px]">
                                                        <p className="font-bold text-slate-800 truncate">{issue.category}</p>
                                                        <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1">{issue.description}</p>
                                                        <div className="text-[10px] font-black uppercase text-slate-400 mt-2">
                                                            Reported: {new Date(issue.dateStarted).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                                                isEscalated ? 'bg-red-100 text-red-700' : 
                                                                issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {isEscalated ? `Level ${issue.escalationLevel} Escalation` : issue.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-start gap-2 max-w-[150px]">
                                                            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                            <p className="text-xs font-bold text-slate-600 leading-tight">
                                                                {issue.rule?.oversight_body || 'Pending'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => navigate(`/issues/${issue.id}`)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:text-indigo-700 hover:border-indigo-300 hover:shadow-md transition-all ml-auto"
                                                        >
                                                            View Records
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                </div>
            )}

            <ClientProfileDrawer 
                isOpen={isProfileDrawerOpen} 
                onClose={() => setIsProfileDrawerOpen(false)} 
                tenantEmail={profileEmail} 
                tenantName={profileName} 
                tenantUnit={profileUnit}
            />
        </div>
    );
};

export default LegalDashboard;
