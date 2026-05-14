
import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Issue } from '../types';
import SignaturePad from './SignaturePad';

interface LetterGeneratorProps {
  issue: Issue;
  profile: any;
  onClose: () => void;
  templateOverride?: 'initial' | 'level_2' | 'level_3';
}

const LetterGenerator: React.FC<LetterGeneratorProps> = ({ issue, profile, onClose, templateOverride }) => {
  const [loading, setLoading] = useState(false);
  const [letterContent, setLetterContent] = useState('');
  const [, setError] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(templateOverride || 'initial');

  const generateLetter = async () => {
    setLoading(true);
    setError('');
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");
      const genAI = new GoogleGenerativeAI(apiKey);
      const repairClockHours = (issue as any).repairClockHours || (issue as any).repair_clock_hours || 336;
      const oversightBody = (issue as any).oversightBody || (issue as any).oversight_body || 'DBI';
      
      let templateInstructions = '';
      if (selectedTemplate === 'level_3') {
        templateInstructions = `Use Template 3: Agency Report. This must be addressed to ${oversightBody} to report the unaddressed violation. Cite the specific issue: ${issue.category}.`;
      } else if (selectedTemplate === 'level_2') {
        templateInstructions = `Use Template 2: "X+1" Notice. The landlord has failed to fix the issue within the legal time frame of ${repairClockHours} hours. Warn that the next step is a formal complaint to ${oversightBody}.`;
      } else {
        templateInstructions = `Use Template 1: Notice of Substandard Condition. This establishes the initial complaint and sets the repair clock. Demand repairs within ${repairClockHours} hours as required by law.`;
      }

      const tenantName = `${profile.first_name || profile.name || ''} ${profile.last_name || ''}`.trim() || 'Tenant';
      const unitNumber = profile.unit_number || profile.unit || 'Unknown';

      const prompt = `Write a formal and legally-toned letter from a tenant for an SRO habitability issue in San Francisco.
      Tenant Name: ${tenantName}
      Unit: ${unitNumber}
      Date Issue Started: ${new Date(issue.dateStarted).toLocaleDateString()}
      
      ${templateInstructions}
      
      INSTRUCTIONS FOR REWRITING THE "RANT":
      The tenant provided the following raw description of the issue:
      ===
      ${issue.description}
      ===
      You must intelligently summarize this raw description. Strip out any overly emotional or colloquial text ("rant") and convert it into a sterile, professional, factual statement of the habitability defect. 
      DO NOT prefix any paragraphs with the word "State:". Simply write the letter naturally.
      
      Include:
      - A firm and professional legal tone.
      - Relevant citations (e.g., SF Housing Code, CA Civil Code) if applicable.
      - Format with placeholders for Tenant Signature and Date.

      AT THE VERY END OF THE LETTER, you MUST append the following exact section, maintaining the tenant's exact original text word-for-word as evidence:
      
      EXHIBIT A: ORIGINAL TENANT STATEMENT
      "${issue.description}"
      `;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: "You are an expert legal strategist for the SF Tenants Union."
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
        }
      });

      setLetterContent(result.response.text() || 'Failed to generate content.');
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please ensure your API key is active.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tenantName = `${profile.first_name || profile.name || ''} ${profile.last_name || ''}`.trim() || 'Tenant';
      const unitNumber = profile.unit_number || profile.unit || 'Unknown';
      const sigImg = signature ? `<img src="${signature}" style="max-width: 200px; margin-top: 10px; border-bottom: 1px solid #000;" />` : `<div style="height: 100px; border-bottom: 1px solid #000; width: 300px; margin-top: 20px;">(Signature)</div>`;

      printWindow.document.write(`
        <html>
          <head>
            <title>Formal Notice to Repair - ${unitNumber}</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 1in; line-height: 1.5; font-size: 12pt; color: #000; }
              .header { margin-bottom: 40px; text-align: right; }
              .content { white-space: pre-wrap; }
              .signature-area { margin-top: 50px; }
              .date { margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <strong>SENT VIA CERTIFIED MAIL</strong><br/>
              Date: ${new Date().toLocaleDateString()}
            </div>
            <div class="content">${letterContent}</div>
            <div class="signature-area">
              ${sigImg}
              <div class="date">${tenantName} - Unit ${unitNumber}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="bg-[#1e3a8a] p-8 text-white flex justify-between items-center shrink-0 rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold">Document Generator</h2>
            <p className="text-xs text-blue-300 uppercase tracking-widest font-black mt-1">E-Sign & Legal Export</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">
          {!letterContent ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white">
                <i className="fa-solid fa-file-signature text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Notice to Repair</h3>
              <p className="text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                We'll draft a formal letter using SF Housing Codes to maximize your legal leverage.
              </p>
              
              <div className="mb-8 max-w-sm mx-auto text-left">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Notice Type</label>
                  <select 
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value as any)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium font-sans"
                  >
                      <option value="initial">Initial Notice of Substandard Condition</option>
                      <option value="level_2">Level 2: Strict "X+1" Escalation Demand</option>
                      <option value="level_3">Level 3: Formal Agency Report</option>
                  </select>
              </div>

              <button
                onClick={generateLetter}
                disabled={loading}
                className="bg-[#1e3a8a] text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center space-x-2 mx-auto disabled:opacity-50 active:scale-95"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                <span>{loading ? 'Consulting Code...' : 'Draft Formal Notice'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl font-serif text-slate-800 whitespace-pre-wrap text-sm shadow-inner leading-relaxed relative">
                <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Draft Copy</div>
                {letterContent}
              </div>

              <div className="border-t pt-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Required: Digital Signature</h3>
                <SignaturePad onSign={setSignature} onClear={() => setSignature(null)} />
              </div>
            </div>
          )}
        </div>

        {letterContent && (
          <div className="p-8 border-t bg-slate-50/50 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 shrink-0 rounded-b-3xl">
            <button
              onClick={handlePrint}
              className="flex-1 bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition shadow-sm flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-print"></i>
              <span>Print & Preview</span>
            </button>
            <button
              className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition shadow-xl flex items-center justify-center space-x-2 active:scale-95"
            >
              <i className="fa-solid fa-paper-plane"></i>
              <span>Send E-Notice</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LetterGenerator;
