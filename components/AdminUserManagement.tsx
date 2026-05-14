import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { Shield, ShieldAlert, Search, Users, ShieldCheck, User as UserIcon } from 'lucide-react';

const AdminUserManagement: React.FC = () => {
    const { tenants, setTenants, user } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

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

    const filteredUsers = tenants.filter(t => {
        const query = searchQuery.toLowerCase();
        return (
            (t.first_name || '').toLowerCase().includes(query) ||
            (t.last_name || '').toLowerCase().includes(query) ||
            (t.name || '').toLowerCase().includes(query) ||
            (t.email || '').toLowerCase().includes(query)
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
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Platform Users & Roles</h2>
                        <p className="text-xs font-medium text-slate-500 mt-1">Manage permissions for the entire application.</p>
                    </div>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700 text-sm shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

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
                                                <select
                                                    value={t.role || 'resident'}
                                                    onChange={(e) => handleRoleChange(t.id, e.target.value)}
                                                    disabled={user.role !== 'superadmin' && t.role === 'superadmin'} // Prevent normal admins from downgrading superadmins
                                                    className={`appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                                >
                                                    <option value="resident">Resident / Tenant</option>
                                                    <option value="legal_counsel">Legal Counsel</option>
                                                    <option value="admin">Platform Admin</option>
                                                    {user.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUserManagement;
