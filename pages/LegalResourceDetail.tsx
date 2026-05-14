import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import DOMPurify from 'dompurify';

interface LegalResource {
    id: string;
    name: string;
    specialty: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    website: string;
}

const LegalResourceDetail: React.FC = () => {
    const { resourceId } = useParams<{ resourceId: string }>();
    const navigate = useNavigate();
    const [resource, setResource] = useState<LegalResource | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResource();
    }, [resourceId]);

    const fetchResource = async () => {
        try {
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('id', resourceId)
                .single();
            
            if (error) throw error;
            setResource(data);
        } catch (err) {
            console.error("Failed to load resource:", err);
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

    if (!resource) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center animate-in fade-in duration-500">
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100">
                    <i className="fa-solid fa-scale-balanced text-5xl text-slate-300 mb-4"></i>
                    <h2 className="text-2xl font-black text-slate-800">Resource Not Found</h2>
                    <p className="text-slate-500 mt-2 font-medium">This legal representation option may have been removed.</p>
                    <button onClick={() => navigate('/legal')} className="mt-8 bg-[#1e3a8a] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg active:scale-95">
                        Back to Legal Resources
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button 
                onClick={() => navigate('/legal')}
                className="mb-8 w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1e3a8a] hover:border-[#1e3a8a] transition-all shadow-sm"
            >
                <i className="fa-solid fa-arrow-left"></i>
            </button>

            {/* Header Section */}
            <div className="bg-white rounded-[40px] shadow-2xl border border-slate-50 overflow-hidden mb-8 relative">
                <div className="bg-[#1e3a8a] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                        <div>
                            <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm inline-block mb-4">
                                Legal Representation
                            </span>
                            <h1 className="text-4xl font-black tracking-tight leading-tight">{resource.name}</h1>
                            {resource.specialty && (
                                <p className="text-blue-200 font-bold mt-2 text-lg">{resource.specialty}</p>
                            )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            {resource.phone && (
                                <a 
                                    href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                                >
                                    <i className="fa-solid fa-phone mr-2 text-sm"></i> Call Firm
                                </a>
                            )}
                            {resource.website && (
                                <a 
                                    href={resource.website.startsWith('http') ? resource.website : `https://${resource.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white text-[#1e3a8a] hover:bg-slate-50 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center transition-all shadow-lg active:scale-95"
                                >
                                    <i className="fa-solid fa-arrow-up-right-from-square mr-2 text-sm"></i> Visit Website
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Contact Info Bar */}
                <div className="bg-blue-50/50 p-6 flex flex-col sm:flex-row flex-wrap gap-6 items-center border-b border-slate-100">
                    {resource.phone && (
                        <div className="flex items-center text-slate-700 font-bold text-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 hidden sm:flex">
                                <i className="fa-solid fa-phone"></i>
                            </div>
                            {resource.phone}
                        </div>
                    )}
                    {resource.email && (
                        <div className="flex items-center text-slate-700 font-bold text-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 hidden sm:flex">
                                <i className="fa-solid fa-envelope"></i>
                            </div>
                            <a href={`mailto:${resource.email}`} className="hover:text-blue-600 transition-colors">{resource.email}</a>
                        </div>
                    )}
                    {resource.website && (
                        <div className="flex items-center text-slate-700 font-bold text-sm w-full sm:w-auto truncate max-w-full">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 hidden shrink-0 sm:flex">
                                <i className="fa-solid fa-globe"></i>
                            </div>
                            <a href={resource.website.startsWith('http') ? resource.website : `https://${resource.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors truncate">
                                {resource.website.replace(/^https?:\/\//, '')}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4">
                                <i className="fa-solid fa-circle-info text-xl"></i>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">About this Firm</h2>
                        </div>
                        <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-headings:text-slate-800 prose-headings:font-black">
                            {resource.description ? (
                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resource.description) }} className="prose prose-sm max-w-none font-medium" />
                            ) : (
                                <p className="italic opacity-60">No additional details provided.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {resource.address && (
                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                            <h3 className="font-black text-slate-800 flex items-center mb-4 uppercase tracking-widest text-xs">
                                <i className="fa-solid fa-location-dot text-rose-500 mr-2"></i> Location
                            </h3>
                            <p className="font-bold text-slate-600 text-sm whitespace-pre-line">{resource.address}</p>
                            
                            <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(resource.address)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-4 w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl font-bold transition-colors flex items-center justify-center text-sm shadow-sm"
                            >
                                <i className="fa-solid fa-map mr-2"></i> View on Map
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegalResourceDetail;
