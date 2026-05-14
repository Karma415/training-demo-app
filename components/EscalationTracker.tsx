import React from 'react';
import { Clock, AlertTriangle, FileWarning, ShieldCheck } from 'lucide-react';
import { useEscalationEngine } from '../hooks/useEscalationEngine';

interface EscalationTrackerProps {
  issueName: string;
  createdAt: string;
  repairClockHours: number;
  onGenerateLetter: (type: 'level_2' | 'level_3') => void;
}

const EscalationTracker: React.FC<EscalationTrackerProps> = ({ issueName, createdAt, repairClockHours, onGenerateLetter }) => {
  const safeRepairClockHours = repairClockHours ?? 24;
  
  const parsedDate = new Date(createdAt);
  const safeCreatedAt = isNaN(parsedDate.getTime()) ? new Date().toISOString() : createdAt;

  const { 
    timeRemaining, 
    status, 
    isLevel2Active
  } = useEscalationEngine(safeCreatedAt, safeRepairClockHours);

  const getStatusStyles = () => {
    switch (status) {
      case 'Expired':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-600',
          border: 'border-rose-200',
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          label: 'Deadline Expired'
        };
      case 'Warning':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-200',
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          label: 'Urgent: < 2h Remaining'
        };
      default:
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          icon: <Clock className="w-5 h-5 text-blue-600" />,
          label: 'Repair Clock Ticking'
        };
    }
  };

  const handleLevel2Escalation = () => {
    if (!isLevel2Active) return;

    // Trigger the AI Letter Generator instead of hardcoded PDF
    onGenerateLetter('level_2');
  };

  const styles = getStatusStyles();

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 mb-8 mt-8">
      <div className="bg-[#1e3a8a] p-4 sm:p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl sm:text-2xl font-black flex items-center">
              <ShieldCheck className="mr-3 w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              Escalation Engine
            </h2>
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
              Resident Action Portal
            </p>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
            Active Issue
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Issue Info */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current Incident</label>
          <p className="text-lg sm:text-xl font-bold text-slate-800">{issueName}</p>
        </div>

        {/* Countdown Display */}
        <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${styles.border} ${styles.bg} flex flex-col items-center justify-center space-y-2 sm:space-y-3 transition-colors duration-500`}>
          <div className="flex items-center space-x-2">
            {styles.icon}
            <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text}`}>
              {styles.label}
            </span>
          </div>
          <div className="text-4xl sm:text-6xl font-black font-mono tracking-tighter text-slate-800">
            {timeRemaining}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Escalation Actions</label>
          
          <button
            disabled={!isLevel2Active}
            onClick={handleLevel2Escalation}
            className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl flex items-center justify-center space-x-3 font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all ${
              isLevel2Active 
                ? 'bg-orange-600 text-white shadow-lg hover:shadow-orange-200 hover:-translate-y-1 active:translate-y-0' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <FileWarning className="w-5 h-5" />
            <span>Legal Notice Generator</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default EscalationTracker;
