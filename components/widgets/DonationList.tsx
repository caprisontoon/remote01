
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, ListFilter, Play, Ban, PlusSquare, 
  ExternalLink, Undo2, MessageSquareText, PlayCircle, 
  PieChart, Star, ShieldCheck, Gift, Box, Settings2
} from 'lucide-react';

const TABS = ['통합 알림', '게임', '뽑기'];

interface DonationItem {
  id: string;
  type: 'Text' | 'Video' | 'Mini' | 'Roulette' | 'Wishlist' | 'Quest' | 'Image' | 'Gift' | 'LuckyBox';
  typeLabel: string;
  nick: string;
  email: string;
  amount: string;
  content: string;
  time: string;
  thumbnail?: string;
  linkTitle?: string;
  isBlocked?: boolean;
  subContent?: string;
}

const MOCK_DONATIONS: DonationItem[] = [
  { id: '1', type: 'Text', typeLabel: '텍스트', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '텍스트 내용 텍스트 내용 텍스트 내용 텍스트 내용...', time: '방금' },
  { id: '2', type: 'Video', typeLabel: '영상', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '유튜브 제목 유튜브 제목 유튜브 제목 유튜브 제목', linkTitle: '[Youtube]', time: '3분', thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=180&fit=crop' },
  { id: '3', type: 'Text', typeLabel: '미니', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '텍스트 내용 텍스트 내용 텍스트 내용...', time: '10분' },
  { id: '4', type: 'Roulette', typeLabel: '룰렛', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '룰렛 제목 - 꽝 or 당첨 항목', time: '3시간' },
  { id: '5', type: 'Wishlist', typeLabel: '위시리스트', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '후원한 상품명', time: '19시간' },
  { id: '6', type: 'Quest', typeLabel: '퀘스트', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '퀘스트 제목 - 성공 or 실패', time: '29일' },
  { id: '7', type: 'Image', typeLabel: '그림', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '그림 후원', time: '2달' },
  { id: '8', type: 'Gift', typeLabel: '기프트', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '상품명 & 개수', time: '11달', thumbnail: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&h=180&fit=crop' },
  { id: '9', type: 'LuckyBox', typeLabel: '럭키박스', nick: '후원닉네임후원닉...', email: '00loo***@gmail.com', amount: '1,000', content: '럭키박스 - 시간초과 환불', time: '5년' },
];

const DonationList: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredThumb, setHoveredThumb] = useState<DonationItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isCompact = width < 480;

  const filteredDonations = useMemo(() => {
    return MOCK_DONATIONS.filter(item => 
      item.nick.includes(searchTerm) || item.content.includes(searchTerm)
    );
  }, [searchTerm]);

  const handleThumbEnter = (e: React.MouseEvent, item: DonationItem) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredThumb(item);
  };

  const getTypeIcon = (type: string) => {
    const commonClass = "w-full h-full p-2 text-white";
    switch(type) {
      case 'Text': return <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center"><MessageSquareText className={commonClass} /></div>;
      case 'Video': return <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center"><PlayCircle className={commonClass} /></div>;
      case 'Roulette': return <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center"><PieChart className={commonClass} /></div>;
      case 'Wishlist': return <div className="w-10 h-10 rounded-lg bg-indigo-400 flex items-center justify-center"><Star className={commonClass} /></div>;
      case 'Quest': return <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center"><ShieldCheck className={commonClass} /></div>;
      case 'Gift': return <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center"><Gift className={commonClass} /></div>;
      case 'LuckyBox': return <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center"><Box className={commonClass} /></div>;
      default: return <div className="w-10 h-10 rounded-lg bg-slate-400 flex items-center justify-center"><MessageSquareText className={commonClass} /></div>;
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white dark:bg-transparent -m-4 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-200 dark:border-white/10">
        <div className="flex px-1 bg-white dark:bg-white/5 pt-2">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 py-2 text-[13px] font-black transition-all relative ${
                activeTab === idx 
                  ? 'text-blue-500' 
                  : 'text-slate-900 dark:text-gray-400'
              }`}
            >
              {tab}
              {activeTab === idx && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-blue-500 rounded-full" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-2 px-3 bg-white dark:bg-white/5">
           <ListFilter size={16} className="text-slate-400" />
           <div className="flex-1" />
           <button className="p-1.5 bg-black dark:bg-white/10 text-white rounded shadow hover:bg-slate-800 transition-all">
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {!isCompact ? (
          // TABLE VIEW
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#1a1a1a] z-20 border-b border-slate-200 dark:border-white/10">
              <tr className="text-[11px] font-bold text-slate-500 dark:text-gray-400">
                <th className="w-[70px] py-2 px-3 border-r border-slate-100 dark:border-white/5">후원</th>
                <th className="w-[160px] py-2 px-3 border-r border-slate-100 dark:border-white/5">닉네임(ID)</th>
                <th className="w-[90px] py-2 px-3 border-r border-slate-100 dark:border-white/5 text-center">후원 캐시</th>
                <th className="py-2 px-3 border-r border-slate-100 dark:border-white/5">내용</th>
                <th className="w-[70px] py-2 px-3 text-center">일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[11px]">
              {filteredDonations.map((item) => (
                <tr 
                  key={item.id} 
                  className={`group transition-all duration-200 hover:bg-slate-100/80 dark:hover:bg-blue-500/10 hover:scale-[1.002] hover:shadow-sm origin-center relative z-0 hover:z-10`}
                  onMouseEnter={() => setHoveredRow(item.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="py-3 px-3 border-r border-slate-100 dark:border-white/5 text-center font-bold text-slate-700 dark:text-gray-300 transition-colors">{item.typeLabel}</td>
                  <td className="py-3 px-3 border-r border-slate-100 dark:border-white/5">
                    <div className="font-bold truncate text-slate-800 dark:text-gray-200 transition-colors">{item.nick}</div>
                    <div className="text-[10px] text-slate-400 truncate">({item.email})</div>
                  </td>
                  <td className="py-3 px-3 border-r border-slate-100 dark:border-white/5 text-center font-black tabular-nums text-slate-900 dark:text-gray-100 transition-colors">{item.amount}</td>
                  <td className="py-3 px-3 border-r border-slate-100 dark:border-white/5 relative group">
                    <div className="flex items-center gap-2 pr-4">
                      {item.thumbnail && (
                        <button 
                          onMouseEnter={(e) => handleThumbEnter(e, item)}
                          onMouseLeave={() => setHoveredThumb(null)}
                          className="px-2 py-0.5 bg-slate-500 dark:bg-slate-700 text-white text-[10px] font-bold rounded hover:bg-slate-600 transition-colors flex-shrink-0"
                        >
                          썸네일
                        </button>
                      )}
                      <div className="truncate text-slate-600 dark:text-gray-300 transition-colors">
                        {item.linkTitle && <span className="text-red-500 font-bold mr-1">{item.linkTitle}</span>}
                        {item.content}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400 font-medium transition-colors">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // COMPACT LIST VIEW (Responsive)
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredDonations.map((item) => (
              <div 
                key={item.id} 
                className="p-4 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-200 flex gap-4 items-start group hover:scale-[1.01] hover:shadow-md relative z-0 hover:z-10 rounded-lg mx-1 my-1"
              >
                {getTypeIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="truncate pr-2">
                      <div className="font-black text-[13px] text-slate-900 dark:text-white truncate">{item.nick}</div>
                      <div className="text-[10px] text-slate-400 dark:text-gray-500 truncate">({item.email})</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-blue-600 dark:text-blue-400 font-black text-[13px]">{item.amount}</div>
                      <div className="text-[10px] text-slate-400 font-medium">1주</div>
                    </div>
                  </div>
                  <div className="mt-1 text-[12px] text-slate-600 dark:text-gray-300 line-clamp-2 leading-snug">
                    {item.linkTitle && <span className="text-red-500 font-bold mr-1">{item.linkTitle}</span>}
                    {item.content}
                  </div>
                  {item.thumbnail && (
                    <div className="mt-2 relative inline-block group/thumb">
                      <button 
                        onMouseEnter={(e) => handleThumbEnter(e, item)}
                        onMouseLeave={() => setHoveredThumb(null)}
                        className="px-3 py-1 bg-slate-600 dark:bg-slate-700 text-white text-[11px] font-bold rounded-lg shadow-sm"
                      >
                        썸네일
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Tooltips */}
      {hoveredThumb && (
        <div 
          className="fixed z-[10000] w-[260px] bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y - 10}px`, 
            transform: 'translate(-50%, -100%)' 
          }}
        >
          <div className="aspect-video w-full bg-slate-200 overflow-hidden">
            <img src={hoveredThumb.thumbnail} className="w-full h-full object-cover" alt="Preview" />
          </div>
          <div className="p-3 bg-slate-50 dark:bg-white/5">
            <div className="text-[12px] font-bold text-slate-800 dark:text-white line-clamp-2">
              {hoveredThumb.content}
            </div>
            {hoveredThumb.type === 'Video' && (
              <button className="w-full mt-3 py-2 bg-slate-800 dark:bg-white dark:text-black text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-2">
                <ExternalLink size={14} /> 영상 보러 가기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationList;
