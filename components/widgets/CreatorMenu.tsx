
import React from 'react';
import { 
  BarChart3, Settings, Bell, LayoutGrid, 
  Activity, Heart, Briefcase, User, 
  Copyright, Headphones, ExternalLink 
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: <BarChart3 size={24} />, label: '대시보드' },
  { icon: <Settings size={24} />, label: '간편설정' },
  { icon: <Bell size={24} />, label: '위젯' },
  { icon: <LayoutGrid size={24} />, label: '모두의 보이스' },
  { icon: <Activity size={24} />, label: '랭킹' },
  { icon: <Heart size={24} />, label: '후원관리' },
  { icon: <Briefcase size={24} />, label: '인벤토리' },
  { icon: <User size={24} />, label: '계정설정' },
  { icon: <Copyright size={24} />, label: '정산' },
  { icon: <Headphones size={24} />, label: '고객센터' },
];

const CreatorMenu: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-3 p-1 h-full overflow-y-auto scrollbar-hide">
      {MENU_ITEMS.map((item, idx) => (
        <button 
          key={idx} 
          className="relative aspect-square flex flex-col items-center justify-center bg-slate-50 hover:bg-white dark:bg-[#333333] dark:hover:bg-[#444444] rounded-[22px] transition-all group shadow-sm dark:shadow-lg active:scale-95 border border-slate-200 dark:border-white/5"
        >
          {/* External Link Icon in top right */}
          <div className="absolute top-2 right-2 text-slate-300 dark:text-white/40 group-hover:text-blue-500 dark:group-hover:text-white/70 transition-colors">
            <ExternalLink size={14} />
          </div>
          
          {/* Main Icon */}
          <div className="text-slate-400 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-white transition-colors mb-2">
            {item.icon}
          </div>
          
          {/* Label */}
          <span className="text-[11px] font-bold text-slate-600 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white tracking-tight">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CreatorMenu;
