import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import DOMPurify from 'dompurify';
import { ShieldCheck, MapPin, Phone, Globe, Info, Mail } from 'lucide-react';

interface AidResource {
  id: string;
  name: string;
  specialty?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  examples?: string;
}

const LegalAidDetail: React.FC = () => {
    const { resourceId } = useParams<{ resourceId: string }>();
    const navigate = useNavigate();
    const [resource, setResource] = useState<AidResource | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                console.error("Error fetching resource:", err);
            } finally {
                setLoading(false);
            }
        };

        if (resourceId) {
            fetchResource();
        }
    }, [resourceId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!resource) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center animate-in fade-in duration-500">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100">
                    <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-800">Resource Not Found</h2>
                    <button onClick={() => navigate('/aid-directory')} className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition">
                        Back to Aid Directory
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <button 
                onClick={() => navigate('/aid-directory')}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 font-bold text-slate-500 hover:text-emerald-600 hover:border-emerald-600 transition shadow-sm"
            >
                <i className="fa-solid fa-arrow-left"></i> Back to Directory
            </button>

            <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full mb-6 text-xs font-black uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4" />
                        Legal Aid / Organization
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight mb-4">
                        {resource.name}
                    </h1>

                    {resource.specialty && (
                        <p className="text-xl text-emerald-600 font-bold mb-8">{resource.specialty}</p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-8">
                        {resource.phone && (
                            <a 
                                href={`tel:${resource.phone.replace(/\D/g, '')}`}
                                className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black transition shadow-md flex items-center justify-center gap-3 text-lg"
                            >
                                <Phone className="w-5 h-5" />
                                Call Organization
                            </a>
                        )}
                        {resource.website && (
                            <a 
                                href={resource.website}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 min-w-[200px] bg-white border-2 border-slate-200 hover:border-emerald-600 hover:text-emerald-600 text-slate-700 px-6 py-4 rounded-2xl font-black transition shadow-sm flex items-center justify-center gap-3 text-lg"
                            >
                                <Globe className="w-5 h-5" />
                                Visit Website
                            </a>
                        )}
                        {resource.email && (
                            <a 
                                href={`mailto:${resource.email}`}
                                className="flex-1 min-w-[200px] bg-white border-2 border-slate-200 hover:border-emerald-600 hover:text-emerald-600 text-slate-700 px-6 py-4 rounded-2xl font-black transition shadow-sm flex items-center justify-center gap-3 text-lg"
                            >
                                <Mail className="w-5 h-5" />
                                Email Organization
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-800 mb-6">
                            <Info className="w-6 h-6 text-emerald-600" />
                            <h2 className="text-2xl font-black">About</h2>
                        </div>
                        {resource.description ? (
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resource.description) }} className="text-slate-600 leading-relaxed font-medium text-lg prose prose-slate max-w-none" />
                        ) : (
                            <p className="text-slate-600 leading-relaxed font-medium text-lg italic opacity-60">
                                No detailed description available.
                            </p>
                        )}
                    </div>
                    
                    {resource.examples && (
                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                            <h2 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-widest text-xs">Examples of Issues Handled</h2>
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resource.examples) }} className="text-slate-700 font-medium prose prose-slate max-w-none" />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-sm">Contact Info</h3>
                        <div className="space-y-6">
                            {resource.phone && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                        <p className="font-bold text-slate-700">{resource.phone}</p>
                                    </div>
                                </div>
                            )}
                            
                            {resource.website && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <Globe className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Website</p>
                                        <a href={resource.website} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline break-all">
                                            {resource.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                </div>
                            )}
                            
                            {resource.email && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                        <a href={`mailto:${resource.email}`} className="font-bold text-emerald-600 hover:underline break-all">
                                            {resource.email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {resource.address && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                                        <p className="font-medium text-slate-700 leading-snug">{resource.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalAidDetail;
