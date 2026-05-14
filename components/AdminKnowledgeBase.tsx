import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Database, Search, Trash2, X, Save, AlertCircle, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface KBEntry {
  id: string;
  source_title: string;
  chunk_content: string;
  created_at?: string;
  // Intentionally omitting embedding array to save bandwidth
}

const AdminKnowledgeBase: React.FC = () => {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      // Only select fields we need, explicitly omitting the heavy `embedding` vector column
      const { data, error } = await supabase
        .from('housing_knowledge')
        .select('id, source_title, chunk_content, created_at')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      console.error("Failed to load KB entries:", err);
      setError("Failed to load database entries: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedding = async (text: string): Promise<number[]> => {
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("Google Gemini API Key is missing. Check VITE_GEMINI_API_KEY in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    // Must match the embedding model used in HousingUniversity.tsx
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    
    const embeddingResult = await embeddingModel.embedContent(text);
    return embeddingResult.embedding.values;
  };

  const handleSave = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setError("Source title and content are required.");
      return;
    }
    
    try {
      setSaveLoading(true);
      setError(null);
      
      // 1. Generate local vector embedding from Gemini
      const vector = await generateEmbedding(newContent);
      
      // 2. Insert into Supabase housing_knowledge
      const { error: insertError } = await supabase
        .from('housing_knowledge')
        .insert({
          source_title: newTitle.trim(),
          chunk_content: newContent.trim(),
          embedding: vector
        });
        
      if (insertError) throw insertError;
      
      // Success! Reset and fetch
      setIsAdding(false);
      setNewTitle('');
      setNewContent('');
      fetchEntries();
    } catch (err: any) {
      console.error("Embedding / Save error:", err);
      setError(err.message || "An error occurred while generating embeddings and saving to the database.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the knowledge source:\n\n"${title}"?`)) return;
    try {
      const { error } = await supabase.from('housing_knowledge').delete().eq('id', id);
      if (error) throw error;
      fetchEntries();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Failed to delete entry from knowledge base.");
    }
  };

  const filteredEntries = entries.filter(e => 
    e.source_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.chunk_content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAdding) {
    return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Database className="w-6 h-6 text-[#1e3a8a]" />
            Upload to AI Knowledge Base
          </h2>
          <button 
            onClick={() => { setIsAdding(false); setNewTitle(''); setNewContent(''); setError(null); }}
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

        <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl mb-8 flex gap-4">
          <Sparkles className="w-6 h-6 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-800 font-medium">
            When you save this entry, the system will automatically call Google's Gemini AI to vectorize this text into a 768-dimensional embedding. It will then be loaded directly into your vector database, instantly allowing the <strong>Ask AI</strong> feature to read and quote it.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Source Title / Reference Law</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-50 transition-all text-lg"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. SF Rent Ordinance § 37.9(a)(1) - Non-payment of Rent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Text Content (The exact law / code)</label>
            <textarea 
              className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-50 transition-all resize-y min-h-[250px]"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Paste the exact text of the law, ordinance, or knowledge here..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              onClick={() => { setIsAdding(false); setNewTitle(''); setNewContent(''); setError(null); }}
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
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Vector...
                </>
              ) : (
                <><Save className="w-4 h-4" /> Save & Vectorize</>
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
            <Database className="w-6 h-6 text-[#1e3a8a]" />
            AI Knowledge Base Library
          </h2>
          <p className="text-slate-500 font-medium text-sm">Manage the verified laws and extracts that power the Ask AI tool.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-sm flex items-center gap-2 max-w-max"
        >
          <Sparkles className="w-5 h-5" /> Vectorize New Text
        </button>
      </div>

      {error && !isAdding && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
      )}

      <div className="mb-6 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input 
          type="text"
          placeholder="Search sources..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium text-slate-700 outline-none focus:border-[#1e3a8a] transition"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Loading vector database...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-100">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No knowledge fragments found</h3>
          <p className="text-slate-500 text-sm mt-1">Try a different search or upload a new text.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-purple-100 transition group relative">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(entry.id, entry.source_title)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-red-600 flex items-center justify-center hover:bg-red-50 transition shadow-sm"
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-2 pr-12">
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded tracking-widest uppercase font-black">
                  Vector Saved
                </span>
                {entry.created_at && (
                    <span className="text-xs font-bold text-slate-400">
                        {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2 pr-12">{entry.source_title}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                {entry.chunk_content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminKnowledgeBase;
