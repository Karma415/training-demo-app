import React from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAdminArticles } from '../hooks/useAdminArticles';

const AdminArticleEditor: React.FC = () => {
    const {
        articles,
        loading,
        isEditing,
        formData,
        updateFormData,
        handleEdit,
        handleCreateNew,
        handleCancel,
        handleSave,
        handleDelete,
    } = useAdminArticles();

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Housing University Articles</h2>
                <button 
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-all text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Write New Article
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Loading Articles...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider font-black text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Author</th>
                                <th className="px-4 py-3">Published</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {articles.map(article => (
                                <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        {article.published_at ? 
                                            <CheckCircle className="w-5 h-5 text-emerald-500" /> : 
                                            <Clock className="w-5 h-5 text-amber-500" />
                                        }
                                    </td>
                                    <td className="px-4 py-3 font-bold text-slate-800">{article.title}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{article.author_name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500">
                                        {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Draft'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleEdit(article)} className="p-2 text-slate-400 hover:text-indigo-600">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(article.id)} className="p-2 text-slate-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {articles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-slate-400 font-bold">No articles found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-black text-slate-800 mb-6 border-b pb-4 shrink-0">
                            {isEditing === 'new' ? 'Write Article' : 'Edit Article'}
                        </h3>
                        
                        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Article Title</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-black text-lg text-slate-800"
                                    value={formData.title || ''}
                                    onChange={e => updateFormData({ title: e.target.value })}
                                    placeholder="e.g. How to File a Rent Board Petition"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Author Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                                        value={formData.author_name || ''}
                                        onChange={e => updateFormData({ author_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-end">
                                    <label className="flex items-center space-x-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={!!formData.published_at}
                                            onChange={e => updateFormData({ 
                                                published_at: e.target.checked ? new Date().toISOString() : undefined 
                                            })}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-bold text-slate-700">Published (Visible to Tenants)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col h-full min-h-[400px]">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Article Content</label>
                                <div className="bg-white rounded-xl overflow-hidden [&_.ql-container]:min-h-[300px] [&_.ql-container]:font-sans [&_.ql-editor]:text-base [&_.ql-toolbar]:border-none [&_.ql-container]:border-none border border-slate-200">
                                    <ReactQuill 
                                        theme="snow"
                                        value={formData.content || ''}
                                        onChange={(content: string) => updateFormData({ content })}
                                        placeholder="Write the article content here. You can use rich text formatting..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                            <button 
                                onClick={handleCancel}
                                className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={!formData.title || !formData.content}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95"
                            >
                                Save Article
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminArticleEditor;
