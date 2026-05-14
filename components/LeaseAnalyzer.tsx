
import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tenant } from '../types';

interface LeaseAnalyzerProps {
  profile: Tenant;
  onUpdate: (updates: Partial<Tenant>) => void;
}

const LeaseAnalyzer: React.FC<LeaseAnalyzerProps> = ({ profile, onUpdate }) => {
  const [analyzing, setAnalyzing] = useState(false);

  const handleSimulateAnalysis = async () => {
    setAnalyzing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");
      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `Analyze a San Francisco Lease for unit ${profile.unit}.
      
      ACCESSIBILITY GOAL: Explain everything at a 6th grade reading level.
      
      Extract and simplify:
      1. 💰 LATE FEES: How much are they? Are they legal? (SF limit is usually around 5%).
      2. 🐕 PETS & ESA: Even if it says 'No Pets', what are your rights for a Support Animal?
      3. 🏠 GUESTS: How long can friends stay over?
      4. 🛠️ REPAIRS: Who pays for what?
      
      Use emojis (💰, 🐕, 🏠, 🛠️) to mark each section. Bold any words that sound like a warning.`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: "You are a 'Plain Language' lease specialist. You help tenants understand their contracts without legal jargon."
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
        }
      });

      onUpdate({ 
        leaseSummary: result.response.text() || 'Analysis failed.',
        leaseAnalyzed: true
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white border rounded-2xl overflow-hidden shadow-md">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#f0f4ff]">
        <div>
          <h3 className="text-lg font-bold text-[#1e3a8a]">Your Lease Cheat Sheet</h3>
          <p className="text-[10px] text-blue-600 uppercase tracking-widest font-black">AI Simplified Rights</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#1e3a8a] shadow-sm">
          <i className="fa-solid fa-file-shield text-2xl"></i>
        </div>
      </div>

      <div className="p-8">
        {!profile.leaseAnalyzed ? (
          <div className="text-center py-10">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                <i className="fa-solid fa-file-invoice text-3xl"></i>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">Lease Language Decoder</h4>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Most leases are hard to read. Upload yours and we will explain the <strong>late fees</strong>, <strong>pet rules</strong>, and <strong>guest rights</strong> in simple terms.
              </p>
              <button 
                onClick={handleSimulateAnalysis}
                disabled={analyzing}
                className="w-full bg-[#1e3a8a] text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 active:scale-95"
              >
                {analyzing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                <span>{analyzing ? 'Scanning for Clauses...' : 'Decode My Lease Agreement'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Lease Decoded at 6th Grade Level</span>
              </div>
              <button 
                onClick={() => onUpdate({ leaseAnalyzed: false })} 
                className="text-[10px] font-bold text-blue-600 hover:text-red-500 flex items-center px-3 py-1 bg-blue-50 rounded-full transition-colors"
              >
                <i className="fa-solid fa-rotate-right mr-1"></i> Upload New
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-inner relative">
              <div className="absolute top-4 right-4 text-slate-200">
                 <i className="fa-solid fa-quote-right text-4xl"></i>
              </div>
              <div className="prose prose-blue max-w-none">
                <div className="whitespace-pre-wrap text-base text-slate-800 leading-relaxed font-serif">
                  {profile.leaseSummary}
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 bg-amber-50 rounded-xl border border-amber-100 flex items-start space-x-4">
              <div className="text-amber-600 mt-1"><i className="fa-solid fa-circle-question text-xl"></i></div>
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Confused about a clause?</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  If your lease says something different than what the AI found, it might be an <strong>illegal clause</strong>. SF law usually overrides the lease on things like repair duties.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaseAnalyzer;
