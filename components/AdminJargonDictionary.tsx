import React from 'react';
import { BookOpen, Plus, Search, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { useAdminJargonDictionary } from '../hooks/useAdminJargonDictionary';

const AdminJargonDictionary: React.FC = () => {
  const {
    filteredTerms,
    loading,
    searchTerm,
    setSearchTerm,
    isEditing,
    currentTerm,
    saveLoading,
    error,
    updateCurrentTerm,
    startNewTerm,
    startEditTerm,
    cancelEditing,
    handleSave,
    handleDelete,
  } = useAdminJargonDictionary();

  if (isEditing) {
    return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#1e3a8a]" />
            {currentTerm.id ? 'Edit Term' : 'Add New Term'}
          </h2>
          <button 
            onClick={cancelEditing}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Legal Term</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-50 transition-all text-lg"
              value={currentTerm.term || ''}
              onChange={e => updateCurrentTerm({ term: e.target.value })}
              placeholder="e.g. Constructive Eviction"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Definition</label>
            <div className="bg-white rounded-xl overflow-hidden [&_.ql-container]:min-h-[150px] [&_.ql-container]:font-sans [&_.ql-editor]:text-base [&_.ql-toolbar]:bg-slate-50 border border-slate-200 focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-[#1e3a8a] transition-all">
                <ReactQuill 
                    theme="snow"
                    value={currentTerm.definition || ''}
                    onChange={(content: string) => updateCurrentTerm({ definition: content })}
                    placeholder="Explain what this means in plain tenant-friendly English..."
                />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              onClick={cancelEditing}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saveLoading}
              className="bg-[#1e3a8a] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {saveLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><Save className="w-4 h-4" /> Save Term</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-1">
            <BookOpen className="w-6 h-6 text-[#1e3a8a]" />
            Legal Jargon Dictionary
          </h2>
          <p className="text-slate-500 font-medium text-sm">Manage the legal terms displayed in the tenant portal.</p>
        </div>
        <button 
          onClick={startNewTerm}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-sm flex items-center gap-2 max-w-max"
        >
          <Plus className="w-5 h-5" /> Add New Term
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input 
          type="text"
          placeholder="Search dictionary..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium text-slate-700 outline-none focus:border-[#1e3a8a] transition"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Loading dictionary...</p>
        </div>
      ) : filteredTerms.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-100">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No terms found</h3>
          <p className="text-slate-500 text-sm mt-1">Try a different search or add a new term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTerms.map(term => (
            <div key={term.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-blue-100 transition group relative">
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <button 
                  onClick={() => startEditTerm(term)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition shadow-sm"
                  title="Edit Term"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(term.id)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-red-600 flex items-center justify-center hover:bg-red-50 transition shadow-sm"
                  title="Delete Term"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2 pr-20">{term.term}</h3>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(term.definition) }} className="text-sm text-slate-600 font-medium leading-relaxed prose prose-sm max-w-none" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminJargonDictionary;
