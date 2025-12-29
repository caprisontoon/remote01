
import React, { useState } from 'react';

const DonationFeatures: React.FC = () => {
  const [active, setActive] = useState<Record<string, boolean>>({
    '전체': true, '텍스트': true, '영상': true, '그림': false, '플레이': true, '게임': true,
    '미니': false, '룰렛': true, '기프트': true, '뽑기': true, '크루': false, '음성': true,
    '퀘스트': true, '럭키박스': true, '시그니처': true
  });

  const toggle = (name: string) => setActive(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-[#2a2a2a] rounded-xl p-3 border border-slate-200 dark:border-white/5 mb-2 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">후원 기능 사용 중</span>
          <div 
            onClick={() => toggle('전체')}
            className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${active['전체'] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${active['전체'] ? 'left-6' : 'left-1'}`} />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-gray-500">사용 중인 후원: 10개</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(active).filter(([k]) => k !== '전체').map(([name, isOn]) => (
          <div 
            key={name}
            onClick={() => toggle(name)}
            className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
              isOn ? 'bg-slate-100 dark:bg-[#333] border-slate-300 dark:border-white/20' : 'bg-white dark:bg-[#1a1a1a] border-slate-100 dark:border-white/5 opacity-50'
            }`}
          >
            <span className={`text-[11px] font-bold ${isOn ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-500'}`}>{name}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isOn ? 'bg-blue-600' : 'bg-slate-200 dark:bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isOn ? 'left-4.5' : 'left-0.5'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonationFeatures;
