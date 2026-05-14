
import React, { useState } from 'react';
import { LoungeMessage, Tenant } from '../types';

interface TenantLoungeProps {
  profile: Tenant;
}

const TenantLounge: React.FC<TenantLoungeProps> = ({ profile }) => {
  const [messages, setMessages] = useState<LoungeMessage[]>([
    { 
      id: 'm1', 
      author: 'David R.', 
      unit: '402', 
      content: 'Has anyone else noticed the hot water being spotty this morning? Second floor is cold.', 
      timestamp: 'Today, 8:15 AM', 
      likes: 3 
    },
    { 
      id: 'm2', 
      author: 'Sarah M.', 
      unit: '301', 
      content: 'Yes! David, I filed a request in the app. Let\'s all log it to show it\'s building-wide.', 
      timestamp: 'Today, 8:45 AM', 
      likes: 5 
    },
    { 
      id: 'm3', 
      author: 'Management (Automated)', 
      unit: 'Admin', 
      content: 'Maintenance has been notified. We expect repairs to take 2-4 hours. Thank you.', 
      timestamp: 'Today, 9:20 AM', 
      likes: 0 
    }
  ]);
  const [newMsg, setNewMsg] = useState('');

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const msg: LoungeMessage = {
      id: 'm_' + Date.now(),
      author: profile.name.split(' ')[0] + ' ' + (profile.name.split(' ')[1]?.charAt(0) || '') + '.',
      unit: profile.unit,
      content: newMsg,
      timestamp: 'Just now',
      likes: 0
    };
    setMessages([msg, ...messages]);
    setNewMsg('');
  };

  return (
    <div className="max-w-4xl animate-in fade-in duration-500 flex flex-col h-[80vh]">
      <div className="mb-8 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tenant Lounge</h1>
          <p className="text-slate-500 mt-1">Secure communication for residents of 123 Main Street.</p>
        </div>
        <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
          <i className="fa-solid fa-lock"></i>
          <span>Building Verified</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.unit === 'Admin' ? 'items-center' : ''}`}>
              {msg.unit === 'Admin' ? (
                <div className="bg-slate-50 px-4 py-2 rounded-full border text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                   <i className="fa-solid fa-robot"></i>
                   <span>{msg.content}</span>
                </div>
              ) : (
                <div className="max-w-[80%] flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0">
                    {msg.author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">{msg.author}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unit {msg.unit}</span>
                      <span className="text-[10px] text-slate-300">• {msg.timestamp}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 text-sm text-slate-600 leading-relaxed shadow-sm">
                      {msg.content}
                    </div>
                    <button className="mt-2 text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center space-x-1 transition-colors">
                      <i className="fa-regular fa-thumbs-up"></i>
                      <span>{msg.likes > 0 ? `${msg.likes} people found this helpful` : 'Helpful'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handlePost} className="p-6 border-t bg-slate-50/50 flex space-x-4">
          <input 
            type="text" 
            placeholder="Share an update with your neighbors..." 
            className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm shadow-inner"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-[#1e3a8a] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-900 transition-all active:scale-95"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-4">
        <i className="fa-solid fa-handshake-angle text-amber-600 mt-1"></i>
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          <strong>Community Safety:</strong> This lounge is private to your building. Use it to coordinate collective petitions or report systematic maintenance failures to your neighbors.
        </p>
      </div>
    </div>
  );
};

export default TenantLounge;
