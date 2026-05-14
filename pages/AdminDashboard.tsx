import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Search, ArrowRight, AlertTriangle, Users, BookOpen, GraduationCap } from 'lucide-react';
import AdminResourceDirectory from '../components/AdminResourceDirectory';
import AdminArticleEditor from '../components/AdminArticleEditor';
import AdminJargonDictionary from '../components/AdminJargonDictionary';
import AdminKnowledgeBase from '../components/AdminKnowledgeBase';
import AdminAttorneyManagement from '../components/AdminAttorneyManagement';
import AdminUserManagement from '../components/AdminUserManagement';
import AdminCommunications from '../components/AdminCommunications';
import Timeline from './Timeline';
import IssueHeatMap from '../components/IssueHeatMap';
import AdminFileCabinet from './AdminFileCabinet';

const AdminDashboard: React.FC = () => {
    const { issues, tenants } = useApp();
    const navigate = useNavigate();
    const [filterAgency, setFilterAgency] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'issues' | 'communications' | 'resources' | 'university' | 'attorneys' | 'users' | 'timeline' | 'heatmap' | 'file-cabinet'>('issues');
    const [uniTab, setUniTab] = useState<'articles' | 'jargon' | 'knowledge'>('articles');
    const openIssues = issues.filter(i => i.status !== 'Resolved');

    const filteredIssues = openIssues.filter(issue => {
        const matchesAgency = filterAgency === 'All' || issue.rule?.oversight_body === filterAgency;
        const tenant = tenants.find(t => t.id === issue.tenantId);
        const searchTarget = `${tenant?.first_name} ${tenant?.last_name} ${tenant?.unit_number} ${issue.category}`.toLowerCase();
        const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
        return matchesAgency && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center">
                        <ShieldCheck className="w-8 h-8 mr-3 text-indigo-600" />
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Platform-wide issue tracking and directory management</p>
                </div>
            </header>

            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 max-w-full w-full lg:w-fit overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('issues')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'issues' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Tenant Issues
                </button>
                <button
                    onClick={() => setActiveTab('communications')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'communications' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <i className="fa-solid fa-bullhorn w-4 h-4"></i>
                    Announcements
                </button>
                <button
                    onClick={() => setActiveTab('resources')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'resources' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Manage Directories
                </button>
                <button
                    onClick={() => setActiveTab('university')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'university' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <GraduationCap className="w-4 h-4" />
                    SF Housing University
                </button>
                <button
                    onClick={() => setActiveTab('attorneys')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'attorneys' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Legal Assignments
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'users' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    System Roles
                </button>
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'timeline' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <i className="fa-solid fa-timeline w-4 h-4"></i>
                    Building Timeline
                </button>
                <button
                    onClick={() => setActiveTab('heatmap')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'heatmap' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <i className="fa-solid fa-map w-4 h-4"></i>
                    Building Heat Map
                </button>
                <button
                    onClick={() => setActiveTab('file-cabinet')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'file-cabinet' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <i className="fa-solid fa-folder-tree w-4 h-4"></i>
                    File Cabinet
                </button>
            </div>

            {activeTab === 'issues' ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                            <h2 className="text-xl font-bold text-slate-800 whitespace-nowrap">Active Tenant Issues</h2>
                            <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                                {['All', 'DBI', 'DPH', 'SFFD'].map(agency => (
                                    <button
                                        key={agency}
                                        onClick={() => setFilterAgency(agency)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            filterAgency === agency 
                                                ? 'bg-white text-indigo-700 shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {agency}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative w-full lg:w-64">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search tenants or issues..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider font-black text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Tenant</th>
                                    <th className="px-6 py-4">Issue</th>
                                    <th className="px-6 py-4">Agency</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Deadline</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredIssues.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No active issues found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIssues.map(issue => {
                                        const tenant = tenants.find(t => t.id === issue.tenantId);
                                        const isEscalated = issue.escalationLevel > 0;
                                        
                                        return (
                                            <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{tenant?.first_name} {tenant?.last_name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">Unit {tenant?.unit_number}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800 line-clamp-1 max-w-xs">{issue.category}</p>
                                                    <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-xs">{issue.description}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                                                        {issue.rule?.oversight_body || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        {isEscalated && <AlertTriangle className="w-4 h-4 text-orange-500 mr-1" />}
                                                        <span className={`text-sm font-bold ${isEscalated ? 'text-orange-600' : 'text-blue-600'}`}>
                                                            {issue.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                                    {issue.repairDeadline ? new Date(issue.repairDeadline).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => navigate(`/issues/${issue.id}`)}
                                                        className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-600 hover:shadow-md transition-all ml-auto"
                                                    >
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
            ) : activeTab === 'communications' ? (
                <AdminCommunications />
            ) : activeTab === 'resources' ? (
                <AdminResourceDirectory />
            ) : activeTab === 'university' ? (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-200">
                        <button
                            onClick={() => setUniTab('articles')}
                            className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-2 transition-all ${
                                uniTab === 'articles' 
                                    ? 'border-[#1e3a8a] text-[#1e3a8a]' 
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <i className="fa-solid fa-file-lines mr-2"></i> Articles & Guides
                        </button>
                        <button
                            onClick={() => setUniTab('jargon')}
                            className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-2 transition-all ${
                                uniTab === 'jargon' 
                                    ? 'border-[#1e3a8a] text-[#1e3a8a]' 
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <i className="fa-solid fa-book mr-2"></i> Jargon Dictionary
                        </button>
                        <button
                            onClick={() => setUniTab('knowledge')}
                            className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-2 transition-all ${
                                uniTab === 'knowledge' 
                                    ? 'border-[#1e3a8a] text-[#1e3a8a]' 
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <i className="fa-solid fa-database mr-2"></i> AI Knowledge Base
                        </button>
                    </div>
                    
                    {uniTab === 'articles' && <AdminArticleEditor />}
                    {uniTab === 'jargon' && <AdminJargonDictionary />}
                    {uniTab === 'knowledge' && <AdminKnowledgeBase />}
                </div>
            ) : activeTab === 'attorneys' ? (
                <AdminAttorneyManagement />
            ) : activeTab === 'users' ? (
                <AdminUserManagement />
            ) : activeTab === 'timeline' ? (
                <Timeline />
            ) : activeTab === 'heatmap' ? (
                <IssueHeatMap issues={issues} />
            ) : activeTab === 'file-cabinet' ? (
                <AdminFileCabinet />
            ) : (
                <AdminArticleEditor /> // Fallback, though activeTab should handle all cases
            )}
        </div>
    );
};

export default AdminDashboard;
