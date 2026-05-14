
import React, { useState, useEffect } from 'react';
import { BuildingViolation } from '../types';

const BuildingIntel: React.FC<{ address: string }> = ({ address }) => {
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState<BuildingViolation[]>([]);

  const fetchCityData = async () => {
    setLoading(true);
    // Simulation of SODA API call to DataSF
    setTimeout(() => {
      setViolations([
        { 
          id: 'v1', 
          address, 
          date: '2023-11-04', 
          category: 'Building Code Violation', 
          status: 'Open', 
          description: 'Failure to maintain fire escape in safe condition. Rusting structural members.' 
        },
        { 
          id: 'v2', 
          address, 
          date: '2022-05-12', 
          category: 'Electrical', 
          status: 'Abated', 
          description: 'Exposed wiring in basement area. Corrected per permit #2022441.' 
        }
      ]);
      setLoading(false);
    }, 1200);
  };

  useEffect(() => {
    fetchCityData();
  }, [address]);

  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Building Intelligence</h1>
          <p className="text-slate-500 mt-1">Live data from DataSF and the Property Information Map (PIM).</p>
        </div>
        <button 
          onClick={fetchCityData}
          className="p-3 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition shadow-sm"
        >
          <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`}></i>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Public Records</p>
            <h3 className="text-2xl font-bold text-slate-800">{violations.length} Reported</h3>
          </div>
          <p className="text-xs text-slate-400 mt-4">Total historical violations found in DataSF for this parcel.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Building Age</p>
            <h3 className="text-2xl font-bold text-slate-800">1924 (Built)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-4">Pre-1979 construction usually indicates Rent Control coverage.</p>
        </div>
        <div className="bg-[#1e3a8a] p-6 rounded-2xl shadow-lg flex flex-col justify-between text-white">
          <div>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Interactive PIM</p>
            <h3 className="text-lg font-bold">Property Map</h3>
          </div>
          <a 
            href={`https://sfplanninggis.org/PIM/?address=${encodeURIComponent(address)}`} 
            target="_blank" 
            className="text-xs font-bold bg-white text-[#1e3a8a] py-2 px-4 rounded-lg text-center mt-4"
          >
            Open Official PIM →
          </a>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <i className="fa-solid fa-list-check mr-2 text-blue-600"></i>
        Historical City Violations
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {violations.map(v => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest mb-2 inline-block ${v.status === 'Open' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {v.status}
                  </span>
                  <h4 className="font-bold text-slate-800 text-lg">{v.category}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Case ID: {v.id.toUpperCase()} • {new Date(v.date).toLocaleDateString()}</p>
                </div>
                <i className={`fa-solid ${v.status === 'Open' ? 'fa-triangle-exclamation text-red-400' : 'fa-check-circle text-emerald-400'} text-2xl`}></i>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-serif italic border-l-2 border-slate-100 pl-4 py-1">
                "{v.description}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuildingIntel;
