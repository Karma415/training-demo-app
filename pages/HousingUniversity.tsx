import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import DOMPurify from 'dompurify';
import { Search, BookOpen, GraduationCap, AlertCircle, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';


const HousingUniversity: React.FC = () => {
    const navigate = useNavigate();
    const { section } = useParams<{ section: string }>();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [citations, setCitations] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [articles, setArticles] = useState<any[]>([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [jargonTerms, setJargonTerms] = useState<any[]>([]);
    const [loadingJargon, setLoadingJargon] = useState(false);

    useEffect(() => {
        if (section === 'articles') {
            fetchArticles();
        } else if (section === 'jargon') {
            fetchJargonTerms();
        }
    }, [section]);

    const fetchJargonTerms = async () => {
        try {
            setLoadingJargon(true);
            const { data, error } = await supabase
                .from('jargon_terms')
                .select('*')
                .order('term', { ascending: true });
                
            if (error) throw error;
            if (data) setJargonTerms(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingJargon(false);
        }
    };

    const fetchArticles = async () => {
        try {
            setLoadingArticles(true);
            const { data, error } = await supabase
                .from('university_articles')
                .select('*')
                .not('published_at', 'is', null)
                .order('published_at', { ascending: false });
            
            if (error) throw error;
            if (data) setArticles(data);
        } catch (err) {
            console.error("Failed to load articles:", err);
        } finally {
            setLoadingArticles(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);
        setAiResponse('');
        setCitations([]);

        try {
            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!geminiApiKey) throw new Error("Google Gemini API Key is missing. Check your environment variables.");

            const genAI = new GoogleGenerativeAI(geminiApiKey);

            // Step 1: Create an embedding out of the user's question
            const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            const embeddingResult = await embeddingModel.embedContent(query);
            const queryVector = embeddingResult.embedding.values;

            // Step 2: Search the Supabase Knowledge Base (using exact cosine similarity via the RPC we updated)
            const { data: matchedDocs, error: matchError } = await supabase.rpc('match_documents', {
                query_embedding: queryVector,
                match_threshold: 0.50, // lower threshold to capture a slightly wider net if necessary
                match_count: 5 // Get top 5 most relevant paragraphs
            });

            if (matchError) throw matchError;

            if (!matchedDocs || matchedDocs.length === 0) {
                setAiResponse("I couldn't find any specific San Francisco housing laws or habitability rules in my database matching your question. Try asking about repairs, eviction protections, or landlord entry.");
                setIsSearching(false);
                return;
            }

            setCitations(matchedDocs);

            // Step 3: Run RAG against the main Gemini text model
            const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const prompt = `
            You are a highly knowledgeable, empathetic, and professional San Francisco tenant rights legal assistant for the SF Housing Hub.
            A tenant has asked a question: "${query}"

            To answer them, you MUST rely EXCLUSIVELY on the verified legal knowledge base extracts provided below. 
            Do NOT hallucinate or make up laws. If the answer is not contained in the extracts, state that your current knowledge base does not cover that specific detail.
            Keep your answer accessible, easy to read, and formatted with bullet points if helpful. Do not use complex legal jargon without explaining it.
            Always remind the tenant to consult with official legal counsel for formal representation.

            === VERIFIED KNOWLEDGE BASE EXTRACTS ===
            ${matchedDocs.map((doc: any, index: number) => `\n[Citation ${index + 1}: ${doc.source_title}]\n${doc.chunk_content}`).join('\n\n')}
            ========================================
            
            Please provide the answer now:
            `;

            const aiResult = await textModel.generateContent(prompt);
            setAiResponse(aiResult.response.text());

        } catch (err: any) {
            console.error("Knowledge base error:", err);
            if (err.message?.includes('429') || err.message?.includes('quota')) {
                setError("The AI is currently receiving too many requests. Please wait about 30 seconds and try your question again.");
            } else {
                setError(err.message || "An error occurred while consulting the knowledge base.");
            }
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header / Hero Section */}
            <header className="bg-gradient-to-br from-[#1e3a8a] to-blue-700 text-white p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
                            <GraduationCap className="w-5 h-5 text-emerald-300" />
                            <span className="text-xs font-black tracking-widest uppercase text-blue-50">Tenant Education Center</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black leading-tight">SF Housing University</h1>
                        <p className="text-blue-100 font-medium text-lg">
                            Ask our AI any question about your housing rights. It instantly scans verified San Francisco ordinances and habitability codes to give you an exact, legally grounded answer.
                        </p>
                    </div>
                </div>
            </header>

            {section === 'ask-ai' && (
                <>
                {/* Search Interface */}
                <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-lg border border-slate-100">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest">
                            What do you need to know?
                        </label>
                        <div className="relative flex items-center group">
                            <div className="absolute left-6 text-slate-400 group-focus-within:text-[#1e3a8a] transition-colors">
                                {isSearching ? (
                                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Search className="w-6 h-6" />
                                )}
                            </div>
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., How long does my landlord have to fix a broken heater? Or, can my landlord enter without 24 hours notice?"
                                className="w-full pl-16 pr-24 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-50 outline-none text-lg text-slate-800 font-medium transition-all min-h-[80px] hover:bg-white resize-y shadow-inner"
                            />
                            <button 
                                type="submit"
                                disabled={isSearching || !query.trim()}
                                className="absolute right-3 top-3 bottom-3 bg-[#1e3a8a] hover:bg-blue-800 disabled:bg-slate-300 text-white px-6 rounded-2xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                            >
                                Ask AI
                                <Sparkles className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-6 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-800 font-bold mb-1">Search Error</h4>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Legal Disclaimer */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-amber-900 font-bold mb-1 uppercase tracking-widest text-sm">Not Legal Advice</h4>
                            <p className="text-amber-800 text-sm leading-relaxed font-medium">
                                The information provided by SF Housing University is generated by artificial intelligence based on public records and is for educational and informational purposes only. It does not constitute legal advice, nor does it establish an attorney-client relationship. Laws and local ordinances change frequently and enforcement interpretations may vary. You must consult with a qualified, licensed tenant attorney or a sanctioned legal aid organization regarding your specific situation before making decisions or taking legal action.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results Canvas */}
                {(aiResponse || isSearching) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* The AI Answer */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-2 text-[#1e3a8a]">
                                <Sparkles className="w-6 h-6" />
                                <h2 className="text-xl font-black uppercase tracking-widest">Expert Answer</h2>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
                                {isSearching ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                    </div>
                                ) : (
                                    <div className="prose prose-slate prose-p:leading-relaxed prose-headings:text-[#1e3a8a] prose-a:text-blue-600 max-w-none">
                                        {/* Simple markdown parsing for the AI string output */}
                                        {aiResponse?.split('\n').map((paragraph, index) => {
                                            let content = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                            
                                            if (content.startsWith('###')) return <h4 key={index} className="text-base font-bold mt-4 mb-2 text-[#1e3a8a]" dangerouslySetInnerHTML={{__html: content.replace(/###\s*/g, '')}} />;
                                            if (content.startsWith('##')) return <h3 key={index} className="text-lg font-black mt-5 mb-3 text-[#1e3a8a]" dangerouslySetInnerHTML={{__html: content.replace(/##\s*/g, '')}} />;
                                            if (content.startsWith('#')) return <h2 key={index} className="text-xl font-black mt-6 mb-4 text-[#1e3a8a]" dangerouslySetInnerHTML={{__html: content.replace(/#\s*/g, '')}} />;
                                            if (content.startsWith('* ') || content.startsWith('- ')) return <li key={index} className="ml-4 mb-2 leading-relaxed" dangerouslySetInnerHTML={{__html: content.substring(2).trim()}} />;
                                            if (content.trim() === '') return <div key={index} className="h-2"></div>;
                                            return <p key={index} className="mb-3 text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{__html: content}} />;
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* The Citations */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-700">
                                <BookOpen className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-widest">Official Sources</h2>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                                {isSearching ? (
                                    <div className="text-center text-slate-400 py-8 animate-pulse font-medium text-sm">
                                        Locating relevant codes in library...
                                    </div>
                                ) : citations.length === 0 ? (
                                    <div className="text-center text-slate-400 py-8 font-medium text-sm">
                                        Specific legal citations will appear here.
                                    </div>
                                ) : (
                                    citations.map((cite, index) => (
                                        <div key={cite.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                                                    Citation {index + 1}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {Math.round(cite.similarity * 100)}% Match
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-sm mb-2">{cite.source_title}</h4>
                                            <p className="text-xs text-slate-500 font-medium line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                                {cite.chunk_content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}
                </>
            )}

            {section === 'articles' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 text-[#1e3a8a] mb-8">
                    <BookOpen className="w-8 h-8" />
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest">Articles & Guides</h2>
                        <p className="text-slate-500 font-medium text-sm">Read the latest tenant rights guides published by the SF Housing Hub.</p>
                    </div>
                </div>

                {loadingArticles ? (
                    <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Loading latest articles...</div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold">No articles currently published.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {articles.map((article: any) => (
                            <div key={article.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] bg-blue-100 text-[#1e3a8a] px-2 py-1 rounded font-black tracking-widest uppercase">
                                            Guide
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">
                                            {new Date(article.published_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">{article.title}</h3>
                                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} className="text-sm font-medium text-slate-500 line-clamp-2 mt-2" />
                                </div>
                                <button
                                    onClick={() => navigate(`/university/article/${article.id}`)}
                                    className="w-full bg-white border border-slate-200 text-[#1e3a8a] py-3 rounded-xl font-bold text-sm hover:bg-[#1e3a8a] hover:text-white transition-all shadow-sm"
                                >
                                    Read Full Article <i className="fa-solid fa-arrow-right ml-1"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}

            {section === 'jargon' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 text-[#1e3a8a] mb-8">
                    <BookOpen className="w-8 h-8" />
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest">Legal Jargon Dictionary</h2>
                        <p className="text-slate-500 font-medium text-sm">Understand common terms used by landlords and attorneys in San Francisco.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loadingJargon ? (
                        <div className="col-span-full py-20 text-center animate-pulse text-slate-400 font-bold">
                            Loading Legal Dictionary...
                        </div>
                    ) : jargonTerms.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-400 font-bold">
                            No terms are currently published in the dictionary.
                        </div>
                    ) : (
                        jargonTerms.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors group">
                                <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-[#1e3a8a] transition-colors">{item.term}</h3>
                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.definition) }} className="text-sm text-slate-600 leading-relaxed font-medium prose prose-sm max-w-none" />
                            </div>
                        ))
                    )}
                </div>
            </div>
            )}
        </div>
    );
};

export default HousingUniversity;
