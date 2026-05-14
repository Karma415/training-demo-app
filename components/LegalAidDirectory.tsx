import React from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useResourcesByCategory } from '../hooks/useResourcesByCategory';

const LegalAidDirectory: React.FC = () => {
  const navigate = useNavigate();
  const { resources, isLoading } = useResourcesByCategory('Aid');

  return (
    <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">Aid Directory</h1>
        <p className="text-slate-500 mt-2">Trusted government and non-profit organizations enforcing tenant rights in San Francisco.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse">
            Loading Directory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((res) => (
            <div key={res.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#1e3a8a]">{res.name}</h3>
                    {res.specialty && (
                        <span className="mt-1 inline-block text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-100">
                        {res.specialty}
                        </span>
                    )}
                  </div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(res.description || '') }} className="text-slate-600 text-sm leading-relaxed mb-4 max-w-none prose prose-sm line-clamp-3" />
                
                {res.examples && (
                    <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Examples of Issues Handled</span>
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(res.examples || '') }} className="text-xs text-emerald-900 font-medium prose prose-sm max-w-none" />
                    </div>
                )}
                
                <div className="space-y-3">
                  {res.address && (
                    <div className="flex items-start space-x-3 text-sm text-slate-500">
                        <i className="fa-solid fa-location-dot mt-1 text-[#1e3a8a]"></i>
                        <span>{res.address}</span>
                    </div>
                  )}
                  {res.phone && (
                    <div className="flex items-center space-x-3 text-sm text-slate-500">
                        <i className="fa-solid fa-phone text-[#1e3a8a]"></i>
                        <span>{res.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 border-t p-4">
                <button
                    onClick={() => navigate(`/aid-directory/${res.id}`)}
                    className="w-full bg-white border border-slate-200 text-[#1e3a8a] py-3 rounded-xl font-bold text-sm hover:bg-[#1e3a8a] hover:text-white transition-all shadow-sm"
                >
                    View Organization Details <i className="fa-solid fa-arrow-right ml-1"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-slate-800 text-white rounded-xl p-8 flex items-center justify-between shadow-lg">
        <div>
          <h3 className="text-xl font-bold mb-2">Need Immediate Legal Representation?</h3>
          <p className="text-slate-400 text-sm max-w-lg">If you have received an unlawful detainer (eviction summons), contact the Eviction Defense Collaborative immediately. You usually only have 5 days to respond.</p>
        </div>
        <i className="fa-solid fa-scale-unbalanced text-5xl text-blue-900/40"></i>
      </div>
    </div>
  );
};

export default LegalAidDirectory;
