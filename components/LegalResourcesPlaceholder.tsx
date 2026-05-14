import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Phone, Globe, Scale } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useResourcesByCategory } from '../hooks/useResourcesByCategory';

const LegalResourcesPlaceholder: React.FC = () => {
  const navigate = useNavigate();
  const { resources, isLoading } = useResourcesByCategory('Legal');

  return (
    <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Legal Representation</h1>
        <p className="text-slate-500 mt-2 font-medium">Curated list of tenant attorneys and legal clinics operating in San Francisco.</p>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm mb-6">
        <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
                <h4 className="text-amber-900 font-bold mb-1 uppercase tracking-widest text-sm">Disclaimer</h4>
                <p className="text-amber-800 text-sm leading-relaxed font-medium">
                    Any opinions in this section regarding attorney performance or past results are not fact and are solely the opinion of the individual who wrote the paragraph. The inclusion of an attorney or firm in this directory does not constitute a formal endorsement or guarantee of representation.
                </p>
            </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm mb-10">
        <div className="flex items-start gap-4">
            <Globe className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <div>
                <h4 className="text-blue-900 font-bold mb-1 uppercase tracking-widest text-sm">Tip: Prepare Before You Call</h4>
                <p className="text-blue-800 text-sm leading-relaxed font-medium">
                    We highly recommend visiting <strong>SF Housing University</strong> to learn necessary vocabulary, ask legal questions, and familiarize yourself with the <em>Legal Jargon Dictionary</em>. Doing so will assist you in making an educated decision when choosing the best attorney for your needs.
                </p>
            </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse">
            Loading Legal Resources...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((res) => (
            <div key={res.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-[#1e3a8a]">{res.name}</h3>
                    {res.specialty && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-sm uppercase tracking-wider border border-blue-200">
                        <Scale className="w-3 h-3" />
                        {res.specialty}
                        </span>
                    )}
                  </div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(res.description || '') }} className="text-slate-700 text-sm leading-relaxed mb-6 font-medium flex-1 max-w-none prose prose-sm line-clamp-3" />
                
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {res.address && (
                    <div className="flex items-start space-x-3 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mt-0.5 text-[#1e3a8a]" />
                        <span className="font-medium">{res.address}</span>
                    </div>
                  )}
                  {res.phone && (
                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-[#1e3a8a]" />
                        <span className="font-medium">{res.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex space-x-3 shrink-0">
                <button 
                  onClick={() => navigate(`/legal/${res.id}`)}
                  className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 hover:bg-blue-900 transition shadow-sm hover:shadow-md"
                >
                  <span>View Details & Contact</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LegalResourcesPlaceholder;
