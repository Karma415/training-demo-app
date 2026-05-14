import React, { useState, useEffect } from 'react';
import { FileText, Pause, Volume2, Inbox } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface OfficialLetter {
  id: string;
  title: string;
  description: string;
  file_url: string;
  audio_url: string;
  target_type: string;
  created_at: string;
}

const LettersNotices: React.FC = () => {
  const { user } = useAuth();
  const [letters, setLetters] = useState<OfficialLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchLetters = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('official_letters')
        .select('*')
        .or(`target_type.eq.all,tenant_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setLetters(data);
      }
      setLoading(false);
    };

    fetchLetters();
  }, [user]);

  const toggleAudio = (letterId: string, audioUrl: string) => {
    if (playingAudioId === letterId && audioElement) {
      audioElement.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const newAudio = new Audio(audioUrl);
    newAudio.play();
    newAudio.onended = () => setPlayingAudioId(null);
    setAudioElement(newAudio);
    setPlayingAudioId(letterId);
  };

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-10 h-10 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
          <Inbox className="w-8 h-8 text-indigo-600 mr-3" />
          Letters & Notices
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Official communications, lease updates, and important notices from management.</p>
      </div>

      <div className="space-y-4">
        {letters.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No notices yet</h3>
            <p className="text-slate-500">You're all caught up! Any new letters will appear here.</p>
          </div>
        ) : (
          letters.map((letter) => (
            <div key={letter.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                      letter.target_type === 'all' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {letter.target_type === 'all' ? 'Building Announcement' : 'Personal Notice'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {new Date(letter.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{letter.title}</h3>
                  {letter.description && (
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{letter.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-3">
                    {letter.file_url && (
                      <a
                        href={letter.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold rounded-xl transition-colors border border-slate-200 hover:border-indigo-200 text-sm"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Document
                      </a>
                    )}
                    
                    {letter.audio_url && (
                      <button
                        onClick={() => toggleAudio(letter.id, letter.audio_url)}
                        className={`inline-flex items-center px-4 py-2 font-semibold rounded-xl transition-colors text-sm border ${
                          playingAudioId === letter.id 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md hover:bg-indigo-700' 
                            : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm'
                        }`}
                      >
                        {playingAudioId === letter.id ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Playing Audio...
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Listen to Read-Aloud
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LettersNotices;
