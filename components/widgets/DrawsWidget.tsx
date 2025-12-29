
import React from 'react';
import { ChevronDown } from 'lucide-react';

const ITEMS = [
  { name: '빼빼로', val: '1/10' },
  { name: '초콜릿', val: '1/10' },
  { name: '리액션', val: '1/10' },
  { name: '꽝', val: '1/10' },
];

const DrawsWidget: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <button className="w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/5 rounded-lg text-xs text-slate-700 dark:text-gray-300 shadow-sm transition-colors">
          <span>크리스마스 뽑기</span>
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 transition-colors shadow-sm">
        <div className="grid grid-cols-2 p-2 text-[10px] font-bold text-slate-400 dark:text-gray-500 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-transparent">
          <span className="pl-2">상품</span>
          <span className="text-center">잔여 수량</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {ITEMS.map((item, idx) => (
            <div key={idx} className="grid grid-cols-2 p-2.5 text-[11px] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="pl-2 text-slate-700 dark:text-gray-300">{item.name}</span>
              <span className="text-center font-bold text-slate-500 dark:text-gray-400">{item.val}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 p-2.5 text-[11px] font-bold border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <span className="pl-2 text-slate-500 dark:text-gray-400">총 수량</span>
          <span className="text-center text-slate-900 dark:text-gray-100">4 / 40</span>
        </div>
      </div>
    </div>
  );
};

export default DrawsWidget;
