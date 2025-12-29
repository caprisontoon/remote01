
import React from 'react';
import { Sun, Moon, Layout, Eye, EyeOff } from 'lucide-react';

interface NotificationSettingsProps {
  currentTheme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  autoHideDock?: boolean;
  onAutoHideToggle?: (value: boolean) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  currentTheme = 'dark', 
  onThemeChange,
  autoHideDock = false,
  onAutoHideToggle
}) => {
  const sections = [
    { title: '투네이션 후원 알림', items: [{ name: '투네이션 후원', icon: 'bg-blue-600' }] },
    { title: '유튜브 알림', items: [{ name: '슈퍼챗', icon: 'bg-red-600' }, { name: '멤버십', icon: 'bg-green-600' }] },
    { title: '치지직 알림', items: [{ name: '치즈 후원', icon: 'bg-emerald-600' }, { name: '치지직 구독', icon: 'bg-emerald-500' }] },
    { title: '트위치 알림', items: [{ name: '비트 후원', icon: 'bg-purple-600' }, { name: '트위치 구독', icon: 'bg-purple-500' }, { name: '구독 선물', icon: 'bg-purple-400' }, { name: '레이드', icon: 'bg-purple-700' }] },
  ];

  const handleThemeChange = (theme: 'dark' | 'light') => {
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dock Visibility Options */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
          인터페이스 설정
        </h3>
        <div 
          onClick={() => onAutoHideToggle?.(!autoHideDock)}
          className={`p-3 bg-slate-50 dark:bg-[#2a2a2a] border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
            autoHideDock ? 'border-orange-500/50 bg-orange-500/5' : 'border-slate-200 dark:border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${autoHideDock ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-white/5 text-slate-500'}`}>
              {autoHideDock ? <EyeOff size={16} /> : <Eye size={16} />}
            </div>
            <div>
              <div className="text-xs font-bold dark:text-white">Dock 자동 숨김</div>
              <div className="text-[10px] text-slate-400">화면 하단 호버 시 표시</div>
            </div>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${autoHideDock ? 'bg-orange-500' : 'bg-slate-300 dark:bg-gray-700'}`}>
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${autoHideDock ? 'left-6' : 'left-1'}`} />
          </div>
        </div>
      </div>

      {/* Theme Selection Section */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
          디스플레이 테마
        </h3>
        <div className="flex gap-2">
          <div 
            onClick={() => handleThemeChange('light')}
            className={`flex-1 p-2 bg-slate-50 dark:bg-[#2a2a2a] border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
              currentTheme === 'light' ? 'border-blue-500 ring-1 ring-blue-500/50 bg-white' : 'border-slate-200 dark:border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun size={14} className={currentTheme === 'light' ? 'text-orange-500' : 'text-slate-400'} />
              <span className={`text-xs font-bold ${currentTheme === 'light' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>라이트</span>
            </div>
          </div>
          <div 
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 p-2 bg-slate-50 dark:bg-[#2a2a2a] border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
              currentTheme === 'dark' ? 'border-blue-500 ring-1 ring-blue-500/50 bg-white dark:bg-[#333]' : 'border-slate-200 dark:border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon size={14} className={currentTheme === 'dark' ? 'text-blue-400' : 'text-slate-400'} />
              <span className={`text-xs font-bold ${currentTheme === 'dark' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>다크</span>
            </div>
          </div>
        </div>
      </div>

      {sections.map((section, idx) => (
        <div key={idx} className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
            {section.title}
          </h3>
          <div className="flex flex-wrap gap-3">
            {section.items.map((item, iIdx) => (
              <div key={iIdx} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-xl ${item.icon} flex flex-col items-center justify-center p-1 border border-black/10 dark:border-white/10 shadow-lg`}>
                  <span className="text-[8px] text-white font-bold leading-tight text-center">{item.name}</span>
                </div>
                <div className="w-8 h-4 rounded-full bg-blue-600 relative cursor-pointer transition-colors">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSettings;
