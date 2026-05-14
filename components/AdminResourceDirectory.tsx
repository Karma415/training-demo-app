import React from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAdminResources } from '../hooks/useAdminResources';

const AdminResourceDirectory: React.FC = () => {
    const {
        resources,
        loading,
        isEditing,
        formData,
        updateFormData,
        handleEdit,
        handleCreateNew,
        handleCancel,
        handleSave,
        handleDelete,
    } = useAdminResources();

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Resource Management</h2>
                <button 
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-all text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add New Resource
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Loading Resources...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider font-black text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {resources.map(res => (
                                <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        {res.is_active ? 
                                            <CheckCircle className="w-5 h-5 text-emerald-500" /> : 
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${res.category === 'Legal' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {res.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-slate-800">{res.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {res.phone && <div className="text-xs">{res.phone}</div>}
                                        {res.website && <a href={res.website} target="_blank" className="text-indigo-600 hover:underline text-xs">Website</a>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleEdit(res)} className="p-2 text-slate-400 hover:text-indigo-600">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(res.id)} className="p-2 text-slate-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {resources.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-slate-400 font-bold">No resources found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-black text-slate-800 mb-6 border-b pb-4">
                            {isEditing === 'new' ? 'Create Resource' : 'Edit Resource'}
                        </h3>
                        
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                                <select 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                                    value={formData.category || 'Aid'}
                                    onChange={e => updateFormData({ category: e.target.value })}
                                >
                                    <option value="Aid">Aid (Non-profit/Gov)</option>
                                    <option value="Legal">Legal (Attorney/Clinic)</option>
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</label>
                                <label className="flex items-center space-x-2 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.is_active !== false}
                                        onChange={e => updateFormData({ is_active: e.target.checked })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-bold text-slate-700">Active (Visible to Tenants)</span>
                                </label>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Name</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                                    value={formData.name || ''}
                                    onChange={e => updateFormData({ name: e.target.value })}
                                    placeholder="Organization or Attorney Name"
                                />
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Specialty</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                                    value={formData.specialty || ''}
                                    onChange={e => updateFormData({ specialty: e.target.value })}
                                    placeholder="e.g. Eviction Defense"
                                />
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                                    value={formData.phone || ''}
                                    onChange={e => updateFormData({ phone: e.target.value })}
                                    placeholder="(xxx) xxx-xxxx"
                                />
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email</label>
                                <input 
                                    type="email" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                                    value={formData.email || ''}
                                    onChange={e => updateFormData({ email: e.target.value })}
                                    placeholder="contact@organization.org"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Address</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                                    value={formData.address || ''}
                                    onChange={e => updateFormData({ address: e.target.value })}
                                    placeholder="Physical address"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Website</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                                    value={formData.website || ''}
                                    onChange={e => updateFormData({ website: e.target.value })}
                                    placeholder="https://"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                                <div className="bg-white rounded-xl overflow-hidden [&_.ql-container]:min-h-[120px] [&_.ql-container]:font-sans [&_.ql-editor]:text-base border border-slate-200">
                                    <ReactQuill 
                                        theme="snow"
                                        value={formData.description || ''}
                                        onChange={(content: string) => updateFormData({ description: content })}
                                        placeholder="Brief description of services or track record..."
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Examples of Issues</label>
                                <div className="bg-white rounded-xl overflow-hidden [&_.ql-container]:min-h-[100px] [&_.ql-container]:font-sans [&_.ql-editor]:text-base border border-slate-200">
                                    <ReactQuill 
                                        theme="snow"
                                        value={formData.examples || ''}
                                        onChange={(content: string) => updateFormData({ examples: content })}
                                        placeholder="Comma list of examples (e.g. Mold, Eviction, Buyouts)"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button 
                                onClick={handleCancel}
                                className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={!formData.name || !formData.category}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95"
                            >
                                Save Resource
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminResourceDirectory;
