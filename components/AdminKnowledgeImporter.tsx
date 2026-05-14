import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Database, UploadCloud, CheckCircle2, AlertCircle, FileText, Link as LinkIcon, Info } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AdminKnowledgeImporter: React.FC = () => {
    const [sourceTitle, setSourceTitle] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [rawText, setRawText] = useState('');
    const [category, setCategory] = useState('habitability');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState<{ current: number, total: number }>({ current: 0, total: 0 });

    // Ensure API Key exists
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // A relatively robust chunking function splitting around 1000 characters
    // prioritizing paragraph breaks (\n\n) or newlines (\n)
    const chunkText = (text: string, targetSize = 1000): string[] => {
        if (!text) return [];
        const chunks: string[] = [];
        const paragraphs = text.split(/\n\n+/);
        
        let currentChunk = "";
        for (const p of paragraphs) {
            const cleanP = p.trim();
            if (!cleanP) continue;
            
            if (currentChunk.length + cleanP.length > targetSize && currentChunk.length > 0) {
                // If appending makes it too big, push current and start new
                chunks.push(currentChunk.trim());
                currentChunk = cleanP;
            } else {
                // Keep building chunk
                currentChunk = currentChunk ? currentChunk + "\n\n" + cleanP : cleanP;
            }
        }
        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    };

    const handleUpload = async () => {
        if (!sourceTitle.trim() || !rawText.trim()) {
            setStatus('error');
            setStatusMessage('Source Title and Content are strictly required.');
            return;
        }

        if (!geminiApiKey) {
            setStatus('error');
            setStatusMessage('Google Gemini API Key is missing. Check your .env file.');
            return;
        }

        try {
            setStatus('processing');
            setStatusMessage('Chunking text document...');
            
            const chunks = chunkText(rawText);
            setProgress({ current: 0, total: chunks.length });
            
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            
            let uploadedCount = 0;

            for (const chunk of chunks) {
                setStatusMessage(`Generating embeddings... (${uploadedCount + 1}/${chunks.length})`);
                
                // 1. Get embedding from Gemini
                const result = await model.embedContent(chunk);
                const embedding = result.embedding.values;

                // 2. Format metadata
                const metadata = {
                    category: category,
                    length: chunk.length
                };

                // 3. Save to Supabase
                const { error: dbError } = await supabase.from('housing_knowledge').insert({
                    source_title: sourceTitle,
                    source_url: sourceUrl || null,
                    chunk_content: chunk,
                    embedding: embedding,
                    metadata: metadata
                });

                if (dbError) {
                    console.error("Supabase insert error:", dbError);
                    throw new Error(`Failed to insert chunk into database: ${dbError.message}`);
                }

                uploadedCount++;
                setProgress({ current: uploadedCount, total: chunks.length });
            }

            setStatus('success');
            setStatusMessage(`Successfully imported ${chunks.length} vectorized chunks into the Knowledge Base!`);
            
            // Clear form
            setRawText('');
            setSourceUrl('');
            
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setStatusMessage(error.message || 'An unexpected error occurred during import.');
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="p-8 border-b border-slate-100 bg-[#1e3a8a] text-white">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Database className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black">Knowledge Base Importer</h2>
                        <p className="text-sm text-blue-100 font-medium">Upload legal codes to train the RAG AI Engine</p>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Source Title (Required)
                        </label>
                        <input
                            type="text"
                            value={sourceTitle}
                            onChange={(e) => setSourceTitle(e.target.value)}
                            placeholder="e.g. SF Health Code Section 13"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <LinkIcon className="w-3 h-3" />
                            Source URL (Optional)
                        </label>
                        <input
                            type="text"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            placeholder="e.g. https://codelibrary.amlegal.com/codes/san_francisco..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-medium text-slate-600"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center">
                        <span>Legal Text Content</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-400 flex items-center gap-1">
                            <Info className="w-3 h-3" /> Auto-chunked & Vectorized
                        </span>
                    </label>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste the raw text of the housing law or document here..."
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-medium text-sm min-h-[250px] resize-y"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                        >
                            <option value="habitability">Habitability Law</option>
                            <option value="rent_ordinance">Rent Ordinance</option>
                            <option value="harassment">Harassment / Intimidation</option>
                            <option value="eviction">Eviction Defense</option>
                            <option value="general_faq">General FAQ</option>
                        </select>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={status === 'processing' || !sourceTitle || !rawText}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a8a] hover:bg-blue-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                        {status === 'processing' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing ({progress.current}/{progress.total})
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-5 h-5" />
                                Vectorize & Save
                            </>
                        )}
                    </button>
                </div>

                {status !== 'idle' && (
                    <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 border ${
                        status === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 
                        status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                        'bg-blue-50 border-blue-100 text-blue-700'
                    }`}>
                        {status === 'error' && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                        {status === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                        {status === 'processing' && <div className="w-5 h-5 shrink-0 mt-0.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />}
                        
                        <div className="text-sm font-bold leading-relaxed">
                            {statusMessage}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminKnowledgeImporter;
