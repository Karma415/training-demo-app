
import React, { useState } from 'react';
import { DBIComplaint } from '../types';

interface DBITrackerProps {
  complaints: DBIComplaint[];
  onAdd: (complaint: Omit<DBIComplaint, 'id'>) => void;
  onUpdateFindings: (id: string, findings: string) => void;
  onDecode: (text: string) => void;
}

const DBITracker: React.FC<DBITrackerProps> = ({ complaints, onAdd, onUpdateFindings, onDecode }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newComp, setNewComp] = useState<Partial<DBIComplaint>>({
    complaintNumber: '',
    dateFiled: new Date().toISOString().split('T')[0],
    inspectorName: '',
    status: 'Open',
    findings: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComp.complaintNumber) {
      onAdd(newComp as Omit<DBIComplaint, 'id'>);
      setShowAdd(false);
      setNewComp({
        complaintNumber: '',
        dateFiled: new Date().toISOString().split('T')[0],
        inspectorName: '',
        status: 'Open',
        findings: ''
      });
    }
  };

  return (
    <div className="max-w-4xl animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">DBI Complaint Tracker</h1>
          <p className="text-slate-500 mt-1">Monitor the status of official city building inspections.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-[#1e3a8a] text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 hover:bg-blue-900 transition shadow-lg"
        >
          <i className="fa-solid fa-file-circle-plus"></i>
          <span>Add City Complaint</span>
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-[#1e3a8a] p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Log DBI Case</h2>
              <button type="button" onClick={() => setShowAdd(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Complaint Number</label>
                <input required placeholder="e.g. 202412345" className="w-full border rounded p-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" value={newComp.complaintNumber} onChange={e => setNewComp({...newComp, complaintNumber: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date Filed</label>
                  <input type="date" className="w-full border rounded p-3 outline-none" value={newComp.dateFiled} onChange={e => setNewComp({...newComp, dateFiled: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Initial Status</label>
                  <select className="w-full border rounded p-3 outline-none" value={newComp.status} onChange={e => setNewComp({...newComp, status: e.target.value as any})}>
                    <option value="Open">Open</option>
                    <option value="NOV Issued">Notice Issued (NOV)</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Inspector (If known)</label>
                <input placeholder="e.g. Inspector John Doe" className="w-full border rounded p-3 outline-none" value={newComp.inspectorName} onChange={e => setNewComp({...newComp, inspectorName: e.target.value})} />
              </div>
              <button className="w-full bg-[#1e3a8a] text-white py-4 rounded-lg font-bold shadow-lg hover:bg-blue-900 transition-colors">
                Save DBI Case to Dashboard
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-4">
          {complaints.length > 0 ? (
            complaints.map(comp => (
              <div key={comp.id} className="bg-white border rounded-xl shadow-sm overflow-hidden border-slate-200">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start border-b border-slate-50">
                  <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#1e3a8a]">
                      <i className="fa-solid fa-building-shield text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 tracking-tight">Complaint #{comp.complaintNumber}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Filed: {new Date(comp.dateFiled).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase mb-2 ${
                      comp.status === 'NOV Issued' ? 'bg-red-50 text-red-700 border-red-200' :
                      comp.status === 'Abated' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {comp.status}
                    </span>
                    <p className="text-[10px] text-slate-400 italic">Inspector: {comp.inspectorName || 'Pending Assignment'}</p>
                  </div>
                </div>
                <div className="p-6 relative group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex justify-between items-center">
                    Findings Log (Preservation of Evidence)
                    {comp.findings && (
                      <button 
                        onClick={() => onDecode(comp.findings)}
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-bold"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                        <span>AI Decode</span>
                      </button>
                    )}
                  </label>
                  <textarea 
                    placeholder="Document what the inspector said during the site visit..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-700 h-32 resize-none outline-none focus:ring-1 focus:ring-blue-500 italic"
                    value={comp.findings}
                    onChange={(e) => onUpdateFindings(comp.id, e.target.value)}
                  />
                  <div className="mt-4 flex space-x-3">
                    <a 
                      href="https://sfplanninggis.org/PIM/"
                      target="_blank"
                      className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 hover:bg-slate-50 transition"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Search SF Property Map</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
              <i className="fa-solid fa-magnifying-glass-location text-5xl text-slate-100 mb-4"></i>
              <h3 className="text-xl font-bold text-slate-400 tracking-tight">No Active DBI Complaints</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto italic">Official city inspections are the gold standard of evidence for Rent Board disputes.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-[#1e3a8a] text-white p-6 rounded-xl shadow-lg border-b-4 border-blue-900">
             <h3 className="font-bold flex items-center mb-4">
                <i className="fa-solid fa-circle-info text-blue-300 mr-2"></i>
                DBI "Property Data Map"
             </h3>
             <p className="text-xs text-blue-100 leading-relaxed mb-6">
               SF DBI maintains a public database. You can search by address to see all historical violations, NOV orders, and current status codes for your building.
             </p>
             <a 
               href="https://dbiweb02.sfgov.org/dbi_complaints/default.aspx?page=AddressQuery" 
               target="_blank"
               className="block w-full text-center bg-blue-600 py-3 rounded-lg font-bold text-xs hover:bg-blue-700 transition"
             >
               Official DBI Status Check
             </a>
           </div>

           <div className="bg-white rounded-xl border p-6 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Status Legend</h3>
             <div className="space-y-3">
               <div className="flex items-center space-x-3">
                 <span className="w-3 h-3 rounded-full bg-red-500"></span>
                 <span className="text-xs font-bold text-slate-700">NOV Issued</span>
                 <span className="text-[9px] text-slate-400">(Violation Found)</span>
               </div>
               <div className="flex items-center space-x-3">
                 <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                 <span className="text-xs font-bold text-slate-700">Open</span>
                 <span className="text-[9px] text-slate-400">(Pending Inspection)</span>
               </div>
               <div className="flex items-center space-x-3">
                 <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                 <span className="text-xs font-bold text-slate-700">Abated</span>
                 <span className="text-[9px] text-slate-400">(Owner Fixed Issue)</span>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DBITracker;
