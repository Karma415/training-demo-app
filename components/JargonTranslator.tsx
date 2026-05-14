
import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const JargonTranslator: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    { name: "Unlawful Detainer", snippet: "A legal procedure by which a landlord may evict a tenant for non-payment of rent, nuisance, or breach of lease agreement, resulting in a court-ordered writ of possession." },
    { name: "Capital Improvement", snippet: "A landlord may petition the Rent Board for a passthrough of 100% of the cost of capital improvements, rehabilitated or energy conservation work to the tenants, provided the work was necessary." },
    { name: "Just Cause", snippet: "Under SF Admin Code § 37.9, a landlord must have one of 16 specific 'just cause' reasons to evict a tenant in a rent-controlled unit." }
  ];

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");
      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `Translate the following dense legal jargon or San Francisco housing code into simple, plain language that a non-lawyer can understand. 
      Input Jargon: "${input}"
      
      Structure your response exactly like this:
      ### 📋 SIMPLE SUMMARY
      [One or two sentences in very plain language]
      
      ### ⚖️ WHAT THIS MEANS FOR YOU
      [A bulleted list of implications]
      
      ### 🚀 RECOMMENDED STEPS
      [A numbered list of actionable things to do next]`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: "You are a helpful and expert tenant rights advocate in San Francisco. Your goal is to simplify legal text without losing critical nuance, while remaining supportive and protective of tenant interests."
      });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
        }
      });
      
      setOutput(result.response.text() || 'No translation could be generated.');
    } catch (err) {
      console.error(err);
      setOutput("⚠️ An error occurred during translation. Please ensure your text isn't too long or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">Plain Language Translator</h1>
        <p className="text-slate-500 mt-2">Paste legal notices, housing codes, or letters from your landlord to get a simple breakdown of your rights.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white border rounded-xl shadow-sm p-6">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Paste Legal Text Here</label>
            <textarea 
              className="w-full h-64 bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-serif leading-relaxed"
              placeholder="E.g., 'Pursuant to San Francisco Administrative Code Section 37.9(a)(1)...'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="mt-4 flex space-x-3">
              <button 
                onClick={handleTranslate}
                disabled={loading || !input}
                className="flex-1 bg-[#1e3a8a] text-white py-3 rounded-lg font-bold flex items-center justify-center space-x-2 hover:bg-blue-900 disabled:opacity-50 transition-all shadow-lg"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>}
                <span>{loading ? 'Translating...' : 'Translate to Plain English'}</span>
              </button>
              <button 
                onClick={() => {setInput(''); setOutput('');}}
                className="p-3 text-slate-400 hover:text-slate-600 transition"
                title="Clear"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Common Jargon Presets</p>
            <div className="grid grid-cols-1 gap-2">
              {presets.map(p => (
                <button 
                  key={p.name}
                  onClick={() => setInput(p.snippet)}
                  className="text-left p-3 text-xs bg-white border border-slate-100 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition flex justify-between items-center group"
                >
                  <span className="font-bold">{p.name}</span>
                  <i className="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          {output ? (
            <div className="bg-white border rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center">
                  <i className="fa-solid fa-check-circle mr-2"></i>
                  Simplified Translation
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="text-blue-400 hover:text-blue-600"
                  title="Copy Results"
                >
                  <i className="fa-solid fa-copy"></i>
                </button>
              </div>
              <div className="p-8 prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed space-y-4">
                  {output}
                </div>
              </div>
              <div className="bg-slate-50 p-6 border-t flex items-start space-x-3">
                <i className="fa-solid fa-circle-info text-blue-600 mt-1"></i>
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  Note: This translation is for informational purposes only and does not constitute formal legal advice. Always consult with the SF Tenants Union or an attorney for specific case strategies.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <i className="fa-solid fa-book-open-reader text-5xl mb-4 opacity-20"></i>
              <h3 className="font-bold tracking-tight">Translation Results</h3>
              <p className="text-xs mt-2 max-w-xs italic">Enter or select a legal snippet to see the plain language breakdown here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JargonTranslator;
