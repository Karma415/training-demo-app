import React from 'react';
import { useNavigate } from 'react-router-dom';

const LeaseDecoderPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto p-4 py-8">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Back
            </button>
            
            <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-2xl border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 z-0"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-3xl flex items-center justify-center shadow-inner mb-6">
                        <i className="fa-solid fa-magnifying-glass-chart text-4xl text-blue-600"></i>
                    </div>
                    
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Lease Decoder</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mb-10 leading-relaxed">
                        Upload your lease agreement to automatically extract your rights, obligations, and legal notices. We use AI to analyze complex legal jargon so you know exactly what you've signed.
                    </p>
                    
                    <div className="w-full max-w-xl mx-auto">
                         <div className="border-3 border-dashed border-slate-200 rounded-3xl p-10 bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-cloud-arrow-up text-2xl text-blue-500"></i>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Upload Lease Document</h3>
                            <p className="text-sm text-slate-400 font-medium">PDF, JPG, or PNG (Max 10MB)</p>
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                         </div>
                    </div>
                </div>

                <div className="relative z-10 mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-shield-halved text-blue-600 text-xl mb-3"></i>
                        <h4 className="font-bold text-slate-800 mb-2">Know Your Rights</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Instantly spot illegal clauses or overreaching rules that violate state laws.</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-calendar-check text-green-600 text-xl mb-3"></i>
                        <h4 className="font-bold text-slate-800 mb-2">Track Deadlines</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Never miss a notice window. Auto-extract renewal and termination dates.</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-language text-purple-600 text-xl mb-3"></i>
                        <h4 className="font-bold text-slate-800 mb-2">Plain English</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Translate archaic legal expressions into terms that are easy to understand.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaseDecoderPage;
