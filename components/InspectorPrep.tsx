
import React, { useState } from 'react';
import { Issue } from '../types';

interface InspectorPrepProps {
  activeIssues: Issue[];
}

const InspectorPrep: React.FC<InspectorPrepProps> = ({ activeIssues }) => {
  const commonChecks = [
    { id: 'c1', label: 'Functional Smoke Detectors', desc: 'Required in every bedroom and hallway.' },
    { id: 'c2', label: 'Carbon Monoxide Alarms', desc: 'Required on every floor.' },
    { id: 'c3', label: 'Unobstructed Exits', desc: 'Fire escapes and hallways must be clear.' },
    { id: 'c4', label: 'Secure Doors & Windows', desc: 'Locks must be functional and windows stay open/closed.' },
    { id: 'c5', label: 'No Visible Mold', desc: 'Check window sills and bathroom ceilings.' },
    { id: 'c6', label: 'Hot Water Temperature', desc: 'Must be at least 120°F.' },
  ];

  const [checked, setChecked] = useState<string[]>([]);

  const toggleCheck = (id: string) => {
    setChecked(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-4xl animate-in slide-in-from-right duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Inspector Visit Prep</h1>
        <p className="text-slate-500 mt-1">Ensure your unit is ready for a Department of Building Inspection (DBI) walkthrough.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <i className="fa-solid fa-clipboard-check text-blue-600 mr-2"></i>
              Common SF Housing Code Checklist
            </h3>
            <div className="space-y-3">
              {commonChecks.map(check => (
                <div key={check.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 mt-0.5 accent-blue-600 rounded"
                    checked={checked.includes(check.id)}
                    onChange={() => toggleCheck(check.id)}
                  />
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{check.label}</p>
                    <p className="text-xs text-slate-500">{check.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1e3a8a] text-white p-6 rounded-xl shadow-lg">
            <h3 className="font-bold mb-2 flex items-center">
              <i className="fa-solid fa-lightbulb text-blue-300 mr-2"></i>
              Pro-Tip for DBI Visits
            </h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Do not fix the issue right before the inspector arrives. They need to see the violation in its current state to issue a "Notice of Violation" (NOV). An NOV is your strongest legal leverage for a Rent Board petition.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Active Violations to Show</h3>
            <div className="space-y-4">
              {activeIssues.length > 0 ? activeIssues.map(iss => (
                <div key={iss.id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="font-bold text-red-800 text-sm">{iss.category}</p>
                  <p className="text-xs text-red-600 line-clamp-2">{iss.description}</p>
                  <p className="text-[10px] text-red-400 mt-2 font-bold uppercase">Reported {new Date(iss.dateStarted).toLocaleDateString()}</p>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic">No active issues reported.</p>
              )}
            </div>
          </div>

          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
            <h3 className="font-bold mb-4 flex items-center">
              <i className="fa-solid fa-camera text-blue-400 mr-2"></i>
              Evidence Binder
            </h3>
            <p className="text-xs text-slate-400 mb-4">Have your timestamped photos and communication log ready to show the inspector as proof of how long the condition has existed.</p>
            <button className="w-full bg-blue-600 py-2 rounded font-bold text-sm hover:bg-blue-700 transition">Download Evidence PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectorPrep;
