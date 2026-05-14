
import React, { useState, useEffect } from 'react';
import { simplifyLegalCode } from '../services/legalEngine';

interface LegalDecoderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  originalText?: string;
}

const LegalDecoderDrawer: React.FC<LegalDecoderDrawerProps> = ({ isOpen, onClose, originalText }) => {
  const [loading, setLoading] = useState(false);
  const [decodedData, setDecodedData] = useState<{
    plainEnglish: string;
    tenantRight: string;
    actionableForm: string;
    checklist: string[];
  } | null>(null);

  useEffect(() => {
    if (isOpen && originalText) {
      handleDecode();
    }
  }, [isOpen, originalText]);

  const handleDecode = async () => {
    if (!originalText) return;
    setLoading(true);
    setDecodedData(null);
    const result = await simplifyLegalCode(originalText);
    if (result) {
      setDecodedData(result);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-book-open-reader text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold">Simplified Legal Aid</h2>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest font-black">Contextual AI Decoder</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50/30">
          <div className="mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Original Jargon</h3>
            <div className="text-xs text-slate-400 italic bg-white border border-slate-100 rounded-xl p-4 font-serif leading-relaxed shadow-sm">
              "{originalText}"
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fa-solid fa-wand-sparkles text-2xl text-[#1e3a8a]"></i>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-600">Translating to Plain English...</p>
              <p className="text-xs text-slate-400 mt-2">Target Reading Level: 6th Grade</p>
            </div>
          ) : decodedData ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <section className="bg-white border-2 border-blue-50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <i className="fa-solid fa-comment-dots text-blue-500"></i>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">The Basic Meaning</h4>
                </div>
                <p className="text-lg text-slate-800 leading-relaxed font-medium">
                  {decodedData.plainEnglish}
                </p>
              </section>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                  <div className="text-2xl">⚖️</div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Right</h4>
                    <p className="text-sm font-bold text-slate-800">{decodedData.tenantRight}</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                  <div className="text-2xl">📄</div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Necessary Paperwork</h4>
                    <p className="text-sm font-bold text-[#1e3a8a] underline decoration-blue-200">{decodedData.actionableForm}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-200 my-8" />

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                    <i className="fa-solid fa-shoe-prints mr-2 text-emerald-500 transform -rotate-90"></i>
                    What do I do now?
                  </h3>
                </div>
                <div className="space-y-4">
                  {decodedData.checklist.map((task, i) => (
                    <div key={i} className="flex items-start space-x-4 p-4 bg-white border border-slate-100 rounded-2xl group hover:border-emerald-200 transition-all shadow-sm">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black border border-emerald-100">
                        {i + 1}
                      </div>
                      <span className="text-sm text-slate-700 font-medium leading-relaxed">{task}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-300">
              <i className="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
              <p className="text-sm">Could not decode this text.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-white">
          <div className="p-4 bg-slate-50 rounded-xl flex items-start space-x-3 mb-6">
            <i className="fa-solid fa-shield-halved text-blue-600 mt-1"></i>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              This tool helps with literacy, not legal strategy. For specific advice on your unit, contact the <strong>SF Tenants Union</strong> counseling line.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-blue-900 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Understood</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalDecoderDrawer;
