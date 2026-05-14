import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import DOMPurify from 'dompurify';
import { BookOpen, Calendar, User } from 'lucide-react';

interface UniversityArticle {
    id: string;
    title: string;
    content: string;
    author_name?: string;
    published_at?: string;
    created_at: string;
}

const UniversityArticleDetail: React.FC = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<UniversityArticle | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticle();
    }, [articleId]);

    const fetchArticle = async () => {
        try {
            const { data, error } = await supabase
                .from('university_articles')
                .select('*')
                .eq('id', articleId)
                .single();
            
            if (error) throw error;
            setArticle(data);
        } catch (err) {
            console.error("Failed to load article:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center animate-in fade-in duration-500">
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-800">Article Not Found</h2>
                    <p className="text-slate-500 mt-2 font-medium">This article may have been unpublished or removed.</p>
                    <button onClick={() => navigate('/university')} className="mt-8 bg-[#1e3a8a] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg active:scale-95">
                        Back to SF Housing University
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 px-[0.5in] py-[1in]">
            <button 
                onClick={() => navigate('/university')}
                className="mb-8 px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 font-bold text-slate-500 hover:text-[#1e3a8a] hover:border-[#1e3a8a] transition-all shadow-sm w-fit inline-flex"
            >
                <i className="fa-solid fa-arrow-left"></i> Back to University
            </button>

            <article className="w-full">
                <div className="mb-12">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-black uppercase tracking-widest inline-block mb-6 shadow-sm">
                        Tenant Education Resource
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                        {article.title}
                    </h1>
                    <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                        {article.author_name && (
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                <User className="w-4 h-4 text-[#1e3a8a]" />
                                <span>{article.author_name}</span>
                            </div>
                        )}
                        {article.published_at && (
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                <Calendar className="w-4 h-4 text-[#1e3a8a]" />
                                <span>{new Date(article.published_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="prose prose-slate prose-lg max-w-none prose-p:text-slate-800 prose-p:leading-relaxed prose-p:text-lg prose-headings:text-slate-900 prose-headings:font-black prose-a:text-[#1e3a8a]">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} />
                </div>
            </article>
        </div>
    );
};

export default UniversityArticleDetail;
