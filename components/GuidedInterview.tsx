
import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const GuidedInterview: React.FC = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const questions = [
    {
      id: 'built_date',
      text: "When was your building built?",
      subtext: "Buildings built before June 1979 generally have full Rent Control.",
      options: [
        { label: "Before June 13, 1979", value: 'pre_1979' },
        { label: "After June 13, 1979", value: 'post_1979' },
        { label: "I am not sure", value: 'unsure' }
      ]
    },
    {
      id: 'unit_type',
      text: "What type of unit do you live in?",
      options: [
        { label: "Apartment / Multi-unit building", value: 'apt' },
        { label: "Single-family home", value: 'house' },
        { label: "Condominium", value: 'condo' },
        { label: "SRO / Residential Hotel", value: 'sro' }
      ]
    },
    {
      id: 'threat',
      text: "Are you currently facing a threat of eviction?",
      options: [
        { label: "Yes, I received a written notice", value: 'notice' },
        { label: "No, I am just researching", value: 'research' }
      ]
    }
  ];

  const handleNext = (value: any) => {
    const newAnswers = { ...answers, [questions[step].id]: value };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      generateReport(newAnswers);
    }
  };

  const generateReport = async (finalAnswers: any) => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");
      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `Act as an SF Tenant advocate. Based on these tenant answers, generate a "Tailored Rights Report".
      Answers: ${JSON.stringify(finalAnswers)}
      
      Focus on:
      1. Are they covered by SF Rent Control?
      2. Are they protected by 'Just Cause' eviction laws (SF Admin Code 37.9)?
      3. What is their first recommended action?
      
      Use 6th-grade reading level. Use emojis. Markdown formatting.`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: "You are the A2J (Access to Justice) bot for the SF Housing Hub."
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
        }
      });
      setReport(result.response.text() || "Report generation failed.");
    } catch (err) {
      console.error(err);
      setReport("An error occurred. Please visit the SF Tenants Union.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setReport(null);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-800">Rights Compass</h1>
        <p className="text-slate-500 mt-2 italic">A guided interview to help you understand your legal protections.</p>
      </div>

      {!report ? (
        <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">
          <div className="h-2 bg-slate-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-500" 
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{questions[step].text}</h2>
              {questions[step].subtext && <p className="text-sm text-slate-400">{questions[step].subtext}</p>}
            </div>
            <div className="space-y-4">
              {questions[step].options.map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => handleNext(opt.value)}
                  className="w-full text-left p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group flex justify-between items-center"
                >
                  <span className="font-bold text-slate-700 group-hover:text-blue-700">{opt.label}</span>
                  <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-blue-500"></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border shadow-xl p-10 prose prose-blue max-w-none">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100 flex items-center">
                <i className="fa-solid fa-circle-check mr-2"></i> Report Generated
              </span>
              <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-red-500 transition">Start Over</button>
            </div>
            <div className="text-slate-800 leading-relaxed font-serif text-lg">
              {loading ? "Calculating rights..." : (
                <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }}></div>
              )}
            </div>
          </div>
          <div className="bg-slate-800 p-8 rounded-3xl text-white shadow-lg flex items-center space-x-6">
            <i className="fa-solid fa-file-pdf text-4xl opacity-40"></i>
            <div>
              <h3 className="font-bold">Export Formal Summary</h3>
              <p className="text-xs text-slate-400">Save this report to show a legal counselor or the Rent Board.</p>
            </div>
            <button className="bg-blue-600 px-6 py-2 rounded-xl font-bold text-sm ml-auto hover:bg-blue-700 transition">Download PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedInterview;
