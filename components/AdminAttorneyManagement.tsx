import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User, CheckCircle2, Loader2, Link as LinkIcon, Unlink } from 'lucide-react';
import { Tenant } from '../types';

interface ClientAssignment {
    id: string;
    attorney_id: string;
    tenant_id: string;
}

const AdminAttorneyManagement: React.FC = () => {
    const [attorneys, setAttorneys] = useState<Tenant[]>([]);
    const [tenantsRequesting, setTenantsRequesting] = useState<Tenant[]>([]);
    const [assignments, setAssignments] = useState<ClientAssignment[]>([]);
    const [selectedAttorneyId, setSelectedAttorneyId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch attorneys
                const { data: attorneyData, error: attorneyError } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('role', 'legal_counsel');
                
                if (attorneyError) throw attorneyError;

                // Fetch tenants requesting attorney
                const { data: tenantData, error: tenantError } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('requests_attorney', true);

                if (tenantError) throw tenantError;

                // Fetch current assignments
                const { data: assignmentData, error: assignmentError } = await supabase
                    .from('client_assignments')
                    .select('*');

                if (assignmentError) throw assignmentError;

                setAttorneys(attorneyData.map((t: any) => ({
                    id: t.id,
                    supabaseId: t.id,
                    name: `${t.first_name} ${t.last_name}`,
                    email: t.email,
                    role: t.role
                } as Tenant)));

                setTenantsRequesting(tenantData.map((t: any) => ({
                    id: t.id,
                    supabaseId: t.id,
                    name: `${t.first_name} ${t.last_name}`,
                    email: t.email,
                    unit: t.unit_number
                } as Tenant)));

                setAssignments(assignmentData || []);
                
                if (attorneyData.length > 0) {
                    setSelectedAttorneyId(attorneyData[0].id);
                }

            } catch (err) {
                console.error("Error fetching attorney data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleAssignment = async (tenantId: string) => {
        if (!selectedAttorneyId) return;

        setIsSaving(true);
        const existing = assignments.find(a => a.attorney_id === selectedAttorneyId && a.tenant_id === tenantId);

        try {
            if (existing) {
                // Delete assignment
                const { error } = await supabase
                    .from('client_assignments')
                    .delete()
                    .eq('id', existing.id);
                
                if (error) throw error;
                setAssignments(assignments.filter(a => a.id !== existing.id));
                setMessage({ type: 'success', text: 'Client unassigned successfully.' });
            } else {
                // Create assignment
                const { data, error } = await supabase
                    .from('client_assignments')
                    .insert({ attorney_id: selectedAttorneyId, tenant_id: tenantId })
                    .select()
                    .single();
                
                if (error) throw error;
                setAssignments([...assignments, data]);
                setMessage({ type: 'success', text: 'Client assigned successfully.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update assignment.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

    const selectedAttorney = attorneys.find(a => a.id === selectedAttorneyId);
    const assignedTenantIds = assignments.filter(a => a.attorney_id === selectedAttorneyId).map(a => a.tenant_id);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
            {/* Left Column: Attorneys */}
            <div className="w-full md:w-1/3 border-r border-slate-100 bg-slate-50/50 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-600" />
                        Legal Counsel
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Select an attorney to manage their assigned clients.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {attorneys.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-4">No attorneys found. Add users with the 'legal_counsel' role.</p>
                    ) : (
                        attorneys.map(attorney => (
                            <button
                                key={attorney.id}
                                onClick={() => setSelectedAttorneyId(attorney.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    selectedAttorneyId === attorney.id 
                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500' 
                                        : 'bg-white border-slate-200 hover:border-indigo-300'
                                }`}
                            >
                                <h3 className="font-bold text-slate-800">{attorney.name}</h3>
                                <p className="text-xs text-slate-500">{attorney.email}</p>
                                <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center">
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    {assignments.filter(a => a.attorney_id === attorney.id).length} Clients
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Column: Tenants */}
            <div className="flex-1 flex flex-col items-center bg-white p-6 relative">
                 {message && (
                    <div className={`absolute top-4 right-4 z-10 p-3 rounded-lg shadow-md text-sm font-bold flex items-center animate-in slide-in-from-top-2 ${
                        message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {message.text}
                    </div>
                )}

                {selectedAttorney ? (
                    <div className="w-full h-full">
                        <div className="mb-6 flex justify-between items-center bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                            <div>
                                <h2 className="text-xl font-black text-indigo-900">{selectedAttorney.name}'s Clients</h2>
                                <p className="text-sm text-indigo-600 font-medium">Toggle assignment to grant/revoke access to tenant records.</p>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-xl shadow-sm text-center">
                                <span className="block text-2xl font-black text-indigo-700 leading-none">{assignedTenantIds.length}</span>
                                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Assigned</span>
                            </div>
                        </div>

                        {tenantsRequesting.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <User className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                <p>No tenants have requested legal representation yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {tenantsRequesting.map(tenant => {
                                    const isAssigned = assignedTenantIds.includes(tenant.id);
                                    return (
                                        <div key={tenant.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                                            isAssigned ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-slate-200'
                                        }`}>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{tenant.name}</h3>
                                                <p className="text-xs text-slate-500">Unit {tenant.unit} • {tenant.email}</p>
                                            </div>
                                            <button 
                                                onClick={() => toggleAssignment(tenant.id)}
                                                disabled={isSaving}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all disabled:opacity-50 ${
                                                    isAssigned 
                                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 hover:text-red-600' 
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                                }`}
                                            >
                                                {isAssigned ? (
                                                    <><Unlink className="w-4 h-4 mr-1.5" /> Remove</>
                                                ) : (
                                                    <><LinkIcon className="w-4 h-4 mr-1.5" /> Assign</>
                                                )}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 h-full">
                        Please select an attorney from the left column to manage assignments.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAttorneyManagement;
