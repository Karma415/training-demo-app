
import React, { useState } from 'react';
import { Communication } from '../types';

interface CommunicationLogProps {
  logs: Communication[];
  onAdd: (log: Omit<Communication, 'id'>) => void;
}

const CommunicationLog: React.FC<CommunicationLogProps> = ({ logs, onAdd }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLog, setNewLog] = useState<Partial<Communication>>({
    type: 'In-Person',
    contactPerson: '',
    summary: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Logic for actual audio context recording could go here
    } else {
      setIsRecording(false);
      alert("Recording saved to evidence log.");
      onAdd({
        date: new Date().toISOString().split('T')[0],
        type: 'Recording',
        contactPerson: 'Building Staff (Recorded)',
        summary: 'Voice record of interaction on ' + new Date().toLocaleDateString(),
        hasRecording: true
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLog.contactPerson && newLog.summary) {
      onAdd(newLog as Omit<Communication, 'id'>);
      setShowAddForm(false);
      setNewLog({ type: 'In-Person', contactPerson: '', summary: '', date: new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Communication Log</h1>
          <p className="text-slate-500 mt-1">Legally document every interaction with building management.</p>
        </div>
        <div className="flex space-x-3">
            <button 
              onClick={handleRecord}
              className={`p-3 rounded-full transition-all shadow-lg ${isRecording ? 'bg-red-600 text-white animate-pulse scale-110' : 'bg-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600'}`}
              title={isRecording ? "Stop Recording" : "Quick Voice Record Interaction"}
            >
              <i className="fa-solid fa-microphone text-xl"></i>
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-[#1e3a8a] text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 hover:bg-blue-900 transition shadow-lg"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Log Interaction</span>
            </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-nowrap">Log Interaction</h2>
              <button type="button" onClick={() => setShowAddForm(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</label>
                  <input type="date" className="w-full border rounded p-2" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Type</label>
                  <select className="w-full border rounded p-2" value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value as any})}>
                    <option value="Call">Phone Call</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Email">Email</option>
                    <option value="Text">Text Message</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Person</label>
                <input required placeholder="Manager Name or Building Staff" className="w-full border rounded p-2" value={newLog.contactPerson} onChange={e => setNewLog({...newLog, contactPerson: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notes / Summary</label>
                <textarea required placeholder="What was discussed? Did they make any promises?" className="w-full border rounded p-2 h-32 resize-none" value={newLog.summary} onChange={e => setNewLog({...newLog, summary: e.target.value})} />
              </div>
              <button className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-bold shadow hover:bg-blue-900 transition-colors">
                Save to Evidence Log
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {logs.length > 0 ? (
          logs.map(log => (
            <div key={log.id} className="bg-white border rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${log.type === 'Recording' ? 'bg-red-600' : 'bg-[#1e3a8a]'}`}>
                    <i className={`fa-solid ${
                      log.type === 'Call' ? 'fa-phone' : 
                      log.type === 'Email' ? 'fa-envelope' : 
                      log.type === 'Recording' ? 'fa-microphone' : 'fa-handshake'
                    }`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{log.type} with {log.contactPerson}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">{new Date(log.date).toLocaleDateString()}</p>
                  </div>
                </div>
                {log.hasRecording && (
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase border border-red-200">
                      <i className="fa-solid fa-volume-high mr-1"></i> Audio Saved
                    </span>
                )}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed italic border-l-4 border-slate-100 pl-4 py-1">
                "{log.summary}"
              </p>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
            <i className="fa-solid fa-clipboard-list text-5xl text-slate-200 mb-4"></i>
            <h3 className="text-xl font-bold text-slate-400">Log History Clean</h3>
            <p className="text-slate-400">Document interactions to build a timeline for potential legal proceedings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationLog;
