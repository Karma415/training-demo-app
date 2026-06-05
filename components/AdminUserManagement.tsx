import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { Shield, ShieldAlert, Search, Users, ShieldCheck, User as UserIcon, Eye, UserCheck, UserX, Clock, ClipboardList } from 'lucide-react';
import ClientProfileDrawer from './ClientProfileDrawer';

const AdminUserManagement: React.FC = () => {
    const { tenants, setTenants, user } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const [profileEmail, setProfileEmail] = useState<string | null>(null);
    const [profileName, setProfileName] = useState('');
    const [profileUnit, setProfileUnit] = useState<string | null>(null);

    // Access Requests State
    const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
    const [accessRequests, setAccessRequests] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [requestSearchQuery, setRequestSearchQuery] = useState('');

    const fetchAccessRequests = async () => {
        setLoadingRequests(true);
        try {
            const { data, error } = await supabase
                .from('access_requests')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setAccessRequests(data || []);
        } catch (err) {
            console.error('Error fetching access requests:', err);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchAccessRequests();
        }
    }, [activeTab]);

    const handleRoleChange = async (targetUserId: string, newRole: string) => {
        setIsUpdating(targetUserId);
        try {
            const { error } = await supabase.rpc('admin_update_tenant_role', {
                target_tenant_id: targetUserId,
                new_role: newRole
            });

            if (error) throw error;

            // Update local state to reflect the change globally
            setTenants(prev => prev.map(t => 
                t.id === targetUserId ? { ...t, role: newRole } : t
            ));
        } catch (err: any) {
            console.error('Error updating role:', err);
            alert(`Failed to update role: ${err.message || 'Unknown error'}`);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleApproveWithQR = async (req: any) => {
        if (!confirm(`Are you sure you want to approve ${req.first_name} ${req.last_name} and create a QR Login account?`)) return;
        try {
            const password = 'pass_' + Math.random().toString(36).substring(2, 10) + '!';
            const { error: rpcError } = await supabase.rpc('admin_create_tenant_with_qr', {
                p_email: req.email.trim(),
                p_first_name: req.first_name.trim(),
                p_last_name: req.last_name.trim(),
                p_unit_number: parseInt(req.unit_number, 10) || 0,
                p_password: password
            });
            if (rpcError) throw rpcError;

            // Mark access request as approved
            const { error: updateError } = await supabase
                .from('access_requests')
                .update({ status: 'approved' })
                .eq('id', req.id);
            if (updateError) throw updateError;

            alert('Account created and request approved successfully!');
            fetchAccessRequests();
        } catch (err: any) {
            console.error('Error approving request:', err);
            alert('Failed to approve request: ' + err.message);
        }
    };

    const handleApproveWithInvite = async (req: any) => {
        if (!confirm(`Are you sure you want to approve ${req.first_name} ${req.last_name} and generate a Self-Signup Invite Code?`)) return;
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { error: insertError } = await supabase
                .from('signup_codes')
                .insert([{
                    code,
                    unit_number: parseInt(req.unit_number, 10) || 0,
                    is_used: false
                }]);
            if (insertError) throw insertError;

            // Mark access request as approved
            const { error: updateError } = await supabase
                .from('access_requests')
                .update({ status: 'approved' })
                .eq('id', req.id);
            if (updateError) throw updateError;

            alert(`Invite code ${code} generated and request approved successfully!`);
            fetchAccessRequests();
        } catch (err: any) {
            console.error('Error approving request:', err);
            alert('Failed to approve request: ' + err.message);
        }
    };

    const handleReject = async (reqId: string) => {
        if (!confirm('Are you sure you want to reject this request?')) return;
        try {
            const { error } = await supabase
                .from('access_requests')
                .update({ status: 'rejected' })
                .eq('id', reqId);
            if (error) throw error;

            alert('Request rejected.');
            fetchAccessRequests();
        } catch (err: any) {
            console.error('Error rejecting request:', err);
            alert('Failed to reject request: ' + err.message);
        }
    };

    const filteredUsers = tenants.filter(t => {
        const query = searchQuery.toLowerCase();
        return (
            (t.first_name || '').toLowerCase().includes(query) ||
            (t.last_name || '').toLowerCase().includes(query) ||
            (t.name || '').toLowerCase().includes(query) ||
            (t.email || '').toLowerCase().includes(query)
        );
    });

    const filteredRequests = accessRequests.filter(r => {
        const query = requestSearchQuery.toLowerCase();
        return (
            (r.first_name || '').toLowerCase().includes(query) ||
            (r.last_name || '').toLowerCase().includes(query) ||
            (r.email || '').toLowerCase().includes(query) ||
            (r.unit_number || '').toLowerCase().includes(query)
        );
    });

    const getRoleIcon = (role: string) => {
        switch(role) {
            case 'superadmin': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
            case 'admin': return <Shield className="w-4 h-4 text-purple-500" />;
            case 'legal_counsel': return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
            default: return <UserIcon className="w-4 h-4 text-slate-400" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch(role) {
            case 'superadmin': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'legal_counsel': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header section with Tabs */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex border-b border-transparent gap-2">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                            >
                                Registered Users
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all relative ${activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                            >
                                Access Requests
                                {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                                        {accessRequests.filter(r => r.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder={activeTab === 'users' ? "Search users..." : "Search requests..."}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700 text-sm shadow-sm"
                        value={activeTab === 'users' ? searchQuery : requestSearchQuery}
                        onChange={(e) => activeTab === 'users' ? setSearchQuery(e.target.value) : setRequestSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {activeTab === 'users' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider font-black text-slate-400">
                            <tr>
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Account Type</th>
                                <th className="px-6 py-4 text-right">Access Level Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-bold text-slate-500">No users found</h3>
                                        <p className="text-sm text-slate-400">Try adjusting your search terms.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 uppercase">
                                                    {(t.firstName?.[0] || t.first_name?.[0] || t.name?.[0] || t.email?.[0] || '?')}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 leading-tight">
                                                        {t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{t.email || 'No email registered'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider shadow-sm ${getRoleBadgeColor(t.role)}`}>
                                                {getRoleIcon(t.role)}
                                                {t.role === 'admin' ? 'Admin' : 
                                                 t.role === 'superadmin' ? 'Super Admin' : 
                                                 t.role === 'legal_counsel' ? 'Attorney' : 'Resident'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end pr-2">
                                                {isUpdating === t.id ? (
                                                    <div className="px-4 py-2 bg-slate-100 rounded-xl text-slate-500 text-sm font-bold flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                                        Updating
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setProfileEmail(t.email || null);
                                                                setProfileName(t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Unknown');
                                                                setProfileUnit(t.unit || null);
                                                                setIsProfileDrawerOpen(true);
                                                            }}
                                                            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm transition-all flex items-center justify-center"
                                                            title="View Intake Profile"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <select
                                                            value={t.role || 'resident'}
                                                            onChange={(e) => handleRoleChange(t.id, e.target.value)}
                                                            disabled={user.role !== 'superadmin' && t.role === 'superadmin'}
                                                            className={`appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                                        >
                                                            <option value="resident">Resident / Tenant</option>
                                                            <option value="legal_counsel">Legal Counsel</option>
                                                            <option value="admin">Platform Admin</option>
                                                            {user.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {loadingRequests ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                            <p className="font-bold text-sm">Loading access requests...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider font-black text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Requestor Details</th>
                                    <th className="px-6 py-4">Unit Number</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Submitted At</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <ClipboardList className="w-8 h-8" />
                                            </div>
                                            <h3 className="font-bold text-slate-500">No requests found</h3>
                                            <p className="text-sm text-slate-400">All caught up or try a different search query.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-800 leading-tight">
                                                        {req.first_name} {req.last_name}
                                                    </p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{req.email}</p>
                                                    {req.phone && <p className="text-[10px] text-slate-400 mt-0.5">{req.phone}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                                                Unit {req.unit_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                    req.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                                    'bg-amber-100 text-amber-800 animate-pulse'
                                                }`}>
                                                    {req.status === 'pending' && <Clock className="w-3 h-3" />}
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2 pr-2">
                                                    {req.status === 'pending' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveWithQR(req)}
                                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1 transition-all"
                                                                title="Create QR Code Account"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5" /> Approve & Create QR
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproveWithInvite(req)}
                                                                className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 shadow-sm flex items-center gap-1 transition-all"
                                                                title="Generate Invite Code"
                                                            >
                                                                <ShieldCheck className="w-3.5 h-3.5" /> Invite Code
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(req.id)}
                                                                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:shadow-sm flex items-center justify-center transition-all"
                                                                title="Reject Request"
                                                            >
                                                                <UserX className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs italic text-slate-400 font-medium">Processed</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
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

export default AdminUserManagement;
