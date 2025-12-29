
import React from 'react';

const VOLUMES = [
  { label: 'TTS', val: 75 },
  { label: '영상', val: 75 },
  { label: '음성', val: 75 },
  { label: '룰렛', val: 75 },
  { label: '럭키박스', val: 75 },
  { label: '플레이', val: 75 },
  { label: '뽑기', val: 75 },
];

const VolumeControl: React.FC = () => {
  return (
    <div className="space-y-3 px-1">
      {VOLUMES.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 w-12">{item.label}</span>
          <div className="flex-1 relative h-4 bg-slate-100 dark:bg-[#2a2a2a] rounded-sm overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-sky-500 dark:bg-sky-400/80 transition-all duration-300" 
              style={{ width: `${item.val}%` }}
            />
            <div className="absolute right-2 inset-y-0 flex items-center text-[8px] font-bold text-slate-600 dark:text-gray-300 pointer-events-none">
              {item.val}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VolumeControl;
