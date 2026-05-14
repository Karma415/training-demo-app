
import React, { useState } from 'react';
import { CollectiveTemplate, Tenant } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface CollectiveActionProps {
  profile: Tenant;
}

const templates: CollectiveTemplate[] = [
  {
    id: 'ct1',
    title: 'Building-Wide Repair Demand',
    description: 'A formal group letter to management regarding systemic failures like elevator outages or roof leaks.',
    legalBasis: 'SF Health & Housing Code, Rule 6.10'
  },
  {
    id: 'ct2',
    title: 'Petition for Meet and Confer',
    description: 'Demand a formal meeting with the landlord to discuss building conditions as a tenant association.',
    legalBasis: 'SF Admin Code § 37.10B'
  },
  {
    id: 'ct3',
    title: 'Joint Notice of Rent Withholding Intent',
    description: 'Warning of group escrow action if repairs are not made. High legal risk: Requires consultation.',
    legalBasis: 'CA Civil Code § 1941.1'
  }
];

const CollectiveAction: React.FC<CollectiveActionProps> = ({ profile }) => {
  const [selected, setSelected] = useState<CollectiveTemplate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState('');

  const generateCollectiveLetter = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");
      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `Write a formal COLLECTIVE tenant demand letter for a group of tenants in San Francisco.
      Topic: ${selected.title}
      Legal Basis: ${selected.legalBasis}
      Details: ${selected.description}
      Representative Unit: ${profile.unit}
      The letter should include a table at the bottom for multiple tenants to sign (Name, Unit, Signature, Date).
      Tone: Firm, professional, and legally grounded in San Francisco Rent Board ordinances.`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: "You are an expert organizer for the San Francisco Tenants Union."
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
        }
      });
      setContent(result.response.text() || 'Failed to generate.');
    } catch (err) {
      console.error(err);
      alert("Error generating collective letter.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${selected?.title}</title><style>body{font-family:serif;padding:1.5in;line-height:1.5;white-space:pre-wrap;}</style></head><body>${content}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Collective Action Toolkit</h1>
        <p className="text-slate-500 mt-1">Power in numbers. Prefilled petitions and templates for building-wide advocacy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-2">Available Templates</h3>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelected(t); setContent(''); }}
              className={`w-full text-left p-6 rounded-xl border transition-all ${selected?.id === t.id ? 'bg-[#1e3a8a] text-white border-blue-900 shadow-xl' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-100 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold">{t.title}</h4>
                <i className={`fa-solid ${selected?.id === t.id ? 'fa-circle-check' : 'fa-circle-chevron-right text-slate-200'}`}></i>
              </div>
              <p className={`text-xs mb-3 ${selected?.id === t.id ? 'text-blue-100' : 'text-slate-500'}`}>{t.description}</p>
              <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${selected?.id === t.id ? 'bg-blue-800 border-blue-700 text-blue-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                Basis: {t.legalBasis}
              </div>
            </button>
          ))}
        </div>

        <div>
          {selected ? (
            <div className="bg-white rounded-xl border shadow-lg overflow-hidden sticky top-8">
              <div className="bg-slate-50 p-6 border-b">
                <h3 className="font-bold text-slate-800">Drafting: {selected.title}</h3>
                <p className="text-xs text-slate-400">AI will generate a group petition for signatures.</p>
              </div>
              <div className="p-8">
                {content ? (
                  <div className="bg-slate-50 p-4 border rounded font-serif text-sm text-slate-800 whitespace-pre-wrap max-h-[400px] overflow-y-auto mb-6">
                    {content}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fa-solid fa-people-group text-5xl text-blue-100 mb-4"></i>
                    <p className="text-sm text-slate-500 px-6 mb-6 italic">This letter will be drafted on behalf of all signing tenants to maximize legal pressure.</p>
                    <button 
                      onClick={generateCollectiveLetter}
                      disabled={generating}
                      className="bg-[#1e3a8a] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-900 disabled:opacity-50 transition-all flex items-center space-x-2 mx-auto"
                    >
                      {generating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-signature"></i>}
                      <span>{generating ? 'Drafting Petition...' : 'Generate Group Petition'}</span>
                    </button>
                  </div>
                )}

                {content && (
                  <div className="flex space-x-3">
                    <button onClick={handlePrint} className="flex-1 bg-[#1e3a8a] text-white py-3 rounded-lg font-bold shadow hover:bg-blue-900 transition">Print & Circulate</button>
                    <button onClick={() => setContent('')} className="p-3 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-rotate"></i></button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <i className="fa-solid fa-arrow-left text-4xl text-slate-200 mb-4"></i>
              <h3 className="font-bold text-slate-400">Select a Collective Template</h3>
              <p className="text-xs text-slate-400">Joint complaints carry more legal weight during a Rent Board hearing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectiveAction;
