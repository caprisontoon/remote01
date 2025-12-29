
import React, { useState } from 'react';
import { Pause, SkipForward } from 'lucide-react';

const QuickMenu: React.FC = () => {
  const [active, setActive] = useState({ alert: true, feature: true });

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      <button className="flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-[#333] transition-all group shadow-sm">
        <Pause size={24} className="text-slate-400 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
        <span className="text-[11px] font-bold text-slate-600 dark:text-gray-300">알림 일시 정지</span>
      </button>
      
      <button className="flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-[#333] transition-all group shadow-sm">
        <SkipForward size={24} className="text-slate-400 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
        <span className="text-[11px] font-bold text-slate-600 dark:text-gray-300">알림 스킵</span>
      </button>

      <div className="bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-sm">
         <div 
          onClick={() => setActive(prev => ({...prev, alert: !prev.alert}))}
          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${active.alert ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}
        >
          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${active.alert ? 'left-6' : 'left-1'}`} />
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 text-center">투네이션 후원 알림</span>
      </div>

      <div className="bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-sm">
         <div 
          onClick={() => setActive(prev => ({...prev, feature: !prev.feature}))}
          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${active.feature ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}
        >
          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${active.feature ? 'left-6' : 'left-1'}`} />
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 text-center">후원 기능 사용 중</span>
      </div>
    </div>
  );
};

export default QuickMenu;
