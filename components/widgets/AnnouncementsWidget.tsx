
import React, { useState } from 'react';
import { Search, Megaphone, CircleAlert, BadgeAlert } from 'lucide-react';
import { Announcement } from '../../types';

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', tag: '안내', title: '2024년 2월 9일(금) ~ 2024년 2월 12일(월) 고객센터 휴무 안내', date: '2024-02-08', isRead: false },
  { id: '2', tag: '정산', title: '정산 신청 마감 3일전 입니다.', date: '2024-02-08', isRead: false },
  { id: '3', tag: '점검', title: '2024년 2월 2일(금) 긴급 점검 안내', date: '2024-02-02', isRead: true },
  { id: '4', tag: '정산', title: '오늘부터 정산 신청이 가능합니다.', date: '2024-02-01', isRead: true },
  { id: '5', tag: '안내', title: '신한카드 결제 서비스 장애 안내(정상화)', date: '2024-01-26', isRead: true },
  { id: '6', tag: '점검', title: '타입캐스트 TTS 임시 점검 안내', date: '2024-01-26', isRead: true },
  { id: '7', tag: '안내', title: '서비스 이용 약관 개정 안내', date: '2024-01-20', isRead: true },
];

const AnnouncementsWidget: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

  const filteredAnnouncements = announcements.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkAllRead = () => {
    setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const getIcon = (tag: string) => {
    switch (tag) {
      case '안내':
      case '점검':
        return <Megaphone size={16} className="text-blue-500" />;
      case '정산':
        return <CircleAlert size={16} className="text-red-500" />;
      default:
        return <BadgeAlert size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a]">
      {/* Search & Actions */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="제목 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="text-[11px] font-bold text-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap"
        >
          모두읽음 표시
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto space-y-2 pr-1 custom-scrollbar">
        {filteredAnnouncements.map((item) => (
          <div
            key={item.id}
            className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
              item.isRead 
                ? 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5' 
                : 'bg-white dark:bg-[#222] border-slate-200 dark:border-white/10 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0">
                {getIcon(item.tag)}
              </div>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className={`text-[11px] font-bold flex-shrink-0 ${item.isRead ? 'text-slate-500 dark:text-gray-500' : 'text-slate-800 dark:text-gray-200'}`}>
                  [{item.tag}]
                </span>
                <span className={`text-[11px] truncate ${item.isRead ? 'text-slate-400 dark:text-gray-500' : 'text-slate-600 dark:text-gray-300'}`}>
                  {item.title}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-gray-600 flex-shrink-0 ml-4">
              {item.date}
            </span>
          </div>
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="py-12 text-center text-slate-400 dark:text-gray-600 text-xs">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsWidget;
