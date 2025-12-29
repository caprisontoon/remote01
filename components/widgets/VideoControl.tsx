
import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const VideoControl: React.FC = () => {
  const [active, setActive] = useState({ auto: true, voiceOnly: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35); 
  const [currentTime, setCurrentTime] = useState(72); 
  const duration = 210; 

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    setProgress(newProgress);
    setCurrentTime(Math.floor((newProgress / 100) * duration));
  };

  return (
    <div className="bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 rounded-xl p-3 h-full flex flex-col justify-between transition-colors shadow-sm">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tight">자동 재생</span>
          <div 
            onClick={() => setActive(prev => ({...prev, auto: !prev.auto}))}
            className={`w-7 h-3.5 rounded-full relative cursor-pointer transition-colors ${active.auto ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${active.auto ? 'left-4' : 'left-0.5'}`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tight">음성만</span>
          <div 
            onClick={() => setActive(prev => ({...prev, voiceOnly: !prev.voiceOnly}))}
            className={`w-7 h-3.5 rounded-full relative cursor-pointer transition-colors ${active.voiceOnly ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${active.voiceOnly ? 'left-4' : 'left-0.5'}`} />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500 dark:text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative h-1.5 group">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full appearance-none bg-slate-200 dark:bg-black/40 rounded-full cursor-pointer overflow-hidden outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0"
          />
          <div 
            className="h-full bg-blue-500 rounded-full transition-all pointer-events-none shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 pt-1">
        <button className="text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-90">
          <SkipBack size={18} fill="currentColor" />
        </button>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-500 transition-all transform active:scale-95 shadow-blue-500/20"
        >
          {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
        </button>
        <button className="text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-90">
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

export default VideoControl;
