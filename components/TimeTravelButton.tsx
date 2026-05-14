import React from 'react';
import { Clock } from 'lucide-react';
import { useTimeTravelIssues } from '../hooks/useTimeTravelIssues';

const TimeTravelButton: React.FC = () => {
  const { loading, handleTimeTravel } = useTimeTravelIssues();

  return (
    <button
      onClick={handleTimeTravel}
      disabled={loading}
      className={`fixed bottom-4 right-4 z-50 flex items-center space-x-2 px-6 py-3 rounded-full font-bold shadow-2xl transition-all ${
        loading ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 active:scale-95'
      }`}
    >
      <Clock className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
      <span>{loading ? 'Time Traveling...' : 'Fast-Forward Time (Expire All)'}</span>
    </button>
  );
};

export default TimeTravelButton;
