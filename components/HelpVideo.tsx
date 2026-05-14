import React from 'react';
import { useLocation } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { useHelpVideo } from '../hooks/useHelpVideo';

const HelpVideo: React.FC = () => {
  const location = useLocation();
  const { videoUrl, embedUrl, isOpen, openVideo, closeVideo } = useHelpVideo(location.pathname);

  if (!videoUrl || !embedUrl) return null;

  return (
    <>
      <button
        onClick={openVideo}
        className="fixed top-20 right-4 sm:top-24 sm:right-8 lg:top-8 lg:right-8 z-[100] w-12 h-12 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-110 transition-all duration-300 flex items-center justify-center animate-in fade-in slide-in-from-top-4"
        title="Play Video Tutorial"
      >
        <Play className="w-5 h-5 ml-1" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Play className="w-5 h-5 ml-1" />
                </div>
                <div>
                  <h3 className="text-white font-bold tracking-wide">Video Tutorial</h3>
                  <p className="text-indigo-300 text-xs font-medium">{location.pathname}</p>
                </div>
              </div>
              <button
                onClick={closeVideo}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="w-full aspect-video bg-black">
              <iframe
                src={embedUrl}
                title="Tutorial Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpVideo;
