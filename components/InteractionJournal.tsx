import React, { useState } from 'react';
import { Smile, Meh, Frown, DoorOpen, Send } from 'lucide-react';

interface InteractionJournalProps {
  onSubmit?: (data: InteractionData) => void;
}

interface InteractionData {
  staffName: string;
  location: string;
  eventDescription: string;
  vibe: 'neutral' | 'dismissive' | 'hostile' | 'illegal_entry';
}

const InteractionJournal: React.FC<InteractionJournalProps> = ({ onSubmit }) => {
  const [staffName, setStaffName] = useState('');
  const [location, setLocation] = useState('Lobby');
  const [eventDescription, setEventDescription] = useState('');
  const [vibe, setVibe] = useState<'neutral' | 'dismissive' | 'hostile' | 'illegal_entry'>('neutral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        staffName,
        location,
        eventDescription,
        vibe
      });
    }
    // Reset form after submission (placeholder for real post logic)
    console.log('Logging interaction:', { staffName, location, eventDescription, vibe });
    alert('Interaction logged locally!');
  };

  const vibeOptions = [
    { id: 'neutral', label: 'Neutral/Friendly', icon: Smile, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { id: 'dismissive', label: 'Dismissive/Rude', icon: Meh, color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { id: 'hostile', label: 'Aggressive/Hostile', icon: Frown, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { id: 'illegal_entry', label: 'Illegal Entry', icon: DoorOpen, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 mb-8 animate-status-pop">
      <div className="bg-[#1e3a8a] p-6 text-white">
        <h2 className="text-xl font-bold flex items-center">
          <i className="fa-solid fa-book-open-reader mr-3"></i>
          Interaction Journal
        </h2>
        <p className="text-slate-300 text-xs mt-1 font-medium uppercase tracking-wider">Mobile Intake Form</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Staff Name */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Staff Member Name
          </label>
          <input
            type="text"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none transition-all text-slate-700 font-semibold"
            placeholder="e.g., John Doe"
            required
          />
        </div>

        {/* Location Selector */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none transition-all text-slate-700 font-semibold appearance-none cursor-pointer"
          >
            <option value="Lobby">Lobby</option>
            <option value="Hallway">Hallway</option>
            <option value="Unit Door">Unit Door</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Event Description */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            The Event
          </label>
          <textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none transition-all text-slate-700 font-medium min-h-[100px] resize-none"
            placeholder="What happened? What was said?"
            required
          />
        </div>

        {/* Vibe Check */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Vibe Check
          </label>
          <div className="grid grid-cols-2 gap-3">
            {vibeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setVibe(option.id as any)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  vibe === option.id
                    ? `${option.bgColor} border-[#1e3a8a] shadow-md`
                    : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                <option.icon className={`w-8 h-8 mb-2 ${vibe === option.id ? option.color : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${vibe === option.id ? 'text-[#1e3a8a]' : 'text-slate-400'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Post to Journal</span>
        </button>
      </form>
    </div>
  );
};

export default InteractionJournal;
