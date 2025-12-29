
import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';

const VotingWidget: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <button className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/5 rounded-lg text-xs text-slate-700 dark:text-gray-300 shadow-sm transition-colors">
          <span>프리미어리그 우승팀은?</span>
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 dark:text-gray-500 font-bold ml-1 uppercase">투표 이름</label>
          <input 
            type="text" 
            placeholder="프리미어리그 우승팀은?" 
            className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 dark:text-gray-500 font-bold ml-1 uppercase">투표 시간</label>
          <div className="flex items-center gap-1 text-xs">
            <input type="text" value="00" className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-center text-slate-900 dark:text-white" />
            <span className="text-slate-400">시간</span>
            <input type="text" value="00" className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-center text-slate-900 dark:text-white" />
            <span className="text-slate-400">분</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 dark:text-gray-500 font-bold ml-1 uppercase">투표 금액</label>
          <div className="relative">
            <input type="text" value="1000" className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg p-2 pr-8 text-xs font-bold text-slate-900 dark:text-white" />
            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 dark:text-gray-500">캐시</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-[10px] text-slate-400 dark:text-gray-500 font-bold ml-1 uppercase tracking-wider">투표 항목</label>
          <div className="space-y-2">
            {[ {n:1, t:'맨시티', c:'text-blue-500'}, {n:2, t:'아스날', c:'text-red-500'}, {n:3, t:'리버풀', c:'text-red-600'}].map(item => (
              <div key={item.n} className="flex items-center gap-2 group hover:bg-slate-50 dark:hover:bg-white/5 p-1 rounded-md transition-colors cursor-default">
                <span className={`text-xs font-bold ${item.c}`}>{item.n}</span>
                <span className="text-xs text-slate-600 dark:text-gray-300 flex-1">{item.t}</span>
              </div>
            ))}
            <button className="flex items-center gap-1.5 text-blue-600 dark:text-blue-500 text-xs font-bold hover:text-blue-500 dark:hover:text-blue-400 transition-colors ml-1 mt-2">
              <Plus size={12} />
              항목 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingWidget;
