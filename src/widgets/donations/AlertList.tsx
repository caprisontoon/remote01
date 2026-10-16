import { ArrowUp, ChevronDown, ChevronUp, ExternalLink, Gamepad2, Gift, Mic, MessageSquareText, PieChart, PlayCircle, ShieldCheck, Sparkles, Star, Box, Brush, Vote, Radio } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { KIND_LABEL, contentText, formatCash, relativeTime, sortDonations, tabOf } from '../../lib/donation';
import { useData, useNow, useSettings } from '../../lib/hooks';
import { useT } from '../../lib/i18n';
import { openUrl } from '../../platform';
import type { Donation, DonationKind } from '../../types';
import { Empty } from '../../components/ui';
import { ResizableTh, RowButtons, ThumbPreview } from './parts';

type Hover = { d: Donation; x: number; y: number; mode: 'text' | 'thumb' } | null;

/** 통합 알림·게임 탭 리스트. 넓으면 표, 좁으면 카드(반응형 UI, p50~53). */
export function AlertList({ tab, compact }: { tab: 'all' | 'game'; compact: boolean }) {
  const t = useT();
  const now = useNow(15_000);
  const donations = useData((d) => d.donations);
  const blocked = useData((d) => d.blockedDonors);
  const playingIds = useData((d) => d.playingIds);
  const filters = useSettings((s) => s.filters);
  const sort = useSettings((s) => s.sort);
  const scroller = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);
  const [playingBelow, setPlayingBelow] = useState(false);

  const list = useMemo(() => {
    const inTab = donations.filter((d) => tabOf(d.kind) === tab);
    const visible = tab === 'all' ? inTab.filter((d) => filters.includes(d.kind)) : inTab;
    return sortDonations(visible, sort);
  }, [donations, tab, filters, sort]);

  // Top 버튼(p43 ②) / 재생 중인 후원 버튼(p43 ③) 노출 판단
  const measure = () => {
    const el = scroller.current;
    if (!el) return;
    setShowTop(el.scrollTop > 4);
    const row = playingIds.length ? el.querySelector<HTMLElement>(`[data-id="${playingIds[0]}"]`) : null;
    if (!row) return setPlayingBelow(false);
    const rowTop = row.getBoundingClientRect().top - el.getBoundingClientRect().top;
    setPlayingBelow(rowTop > el.clientHeight - 8);
  };
  useLayoutEffect(measure, [playingIds, list, compact]);

  const scrollToPlaying = () => {
    const row = scroller.current?.querySelector<HTMLElement>(`[data-id="${playingIds[0]}"]`);
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const onEnterContent = (e: React.MouseEvent, d: Donation, mode: 'text' | 'thumb') => {
    const box = scroller.current!.parentElement!.getBoundingClientRect();
    const cell = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHover({ d, mode, x: cell.left - box.left, y: cell.bottom - box.top });
  };

  if (list.length === 0) return <Empty>{tab === 'all' && filters.length === 0 ? '필터에서 선택된 후원 종류가 없습니다.' : '아직 받은 후원이 없습니다.'}</Empty>;

  return (
    <div className="relative h-full" onMouseLeave={() => setHover(null)}>
      <div ref={scroller} onScroll={measure} className="h-full overflow-auto">
        {compact ? (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {list.map((d) => (
              <Card key={d.id} d={d} now={now} blocked={blocked.includes(d.donorId)} playing={playingIds.includes(d.id)} open={expanded === d.id} onToggle={() => setExpanded((v) => (v === d.id ? null : d.id))} />
            ))}
          </ul>
        ) : (
          <table className="w-full table-fixed border-collapse text-[11px]">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181b] text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
              <tr>
                {tab === 'all' && <ResizableTh col="all.kind" width={76}>{t('후원')}</ResizableTh>}
                <ResizableTh col={`${tab}.nick`} width={170}>{t('닉네임(ID)')}</ResizableTh>
                <ResizableTh col={`${tab}.cash`} width={86} className="text-center">{tab === 'game' ? t('후원 금액(원)') : t('후원 캐시')}</ResizableTh>
                <ResizableTh col={`${tab}.content`}>{t('내용')}</ResizableTh>
                <th className="w-[112px] py-2 px-2.5 font-bold text-center">{t('일시')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const isBlocked = blocked.includes(d.donorId);
                const playing = playingIds.includes(d.id);
                return (
                  <tr
                    key={d.id}
                    data-id={d.id}
                    className={`group border-b border-slate-100 dark:border-white/5 transition-all hover:relative hover:z-[1] hover:shadow-[0_4px_14px_rgba(15,23,42,0.12)] hover:-translate-y-px ${
                      isBlocked ? 'bg-slate-100 text-slate-400 dark:bg-white/[0.03] dark:text-gray-500' : playing ? 'playing-row bg-red-50 dark:bg-red-500/10' : 'bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {tab === 'all' && <td className="py-2.5 px-2.5 font-bold truncate">{KIND_LABEL[d.kind]}</td>}
                    <td className="py-2 px-2.5">
                      <div className="font-bold truncate text-slate-800 dark:text-gray-100">{d.nickname}</div>
                      <div className="text-[10px] text-slate-400 truncate">({d.account})</div>
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-black tabular-nums">{formatCash(d.cash)}</td>
                    <td className="py-2.5 px-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {d.thumbnail && (
                          <img src={d.thumbnail} alt="썸네일" onMouseEnter={(e) => onEnterContent(e, d, 'thumb')} className="w-10 h-6 rounded object-cover shrink-0 cursor-pointer" />
                        )}
                        <span className="truncate" onMouseEnter={(e) => !d.thumbnail && onEnterContent(e, d, 'text')}>
                          {d.kind === 'video' && <span className="text-red-500 font-bold mr-1">[{d.platform}]</span>}
                          {d.kind === 'video' ? d.title : contentText(d)}
                        </span>
                      </div>
                    </td>
                    <td className="py-1 px-1.5 text-center">
                      <div className={`${isBlocked ? 'hidden' : 'group-hover:hidden'} text-slate-400`}>{relativeTime(d.createdAt, now)}</div>
                      <div className={`${isBlocked ? 'flex' : 'hidden group-hover:flex'} justify-center`}>
                        <RowButtons d={d} blocked={isBlocked} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {hover && (
        <div className="absolute z-30 pointer-events-auto" style={{ left: Math.max(8, Math.min(hover.x, (scroller.current?.clientWidth ?? 400) - 250)), top: hover.y + 2 }} onMouseLeave={() => setHover(null)}>
          {hover.mode === 'thumb' ? (
            <ThumbPreview d={hover.d} />
          ) : (
            <div className="max-w-[320px] rounded-lg bg-slate-900 text-white text-[11px] leading-relaxed px-3 py-2 shadow-xl whitespace-pre-wrap select-text">{contentText(hover.d)}</div>
          )}
        </div>
      )}

      <div className="absolute right-3 bottom-3 flex flex-col items-end gap-2 z-20">
        {showTop && (
          <button onClick={() => scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })} className="h-8 px-3 rounded-full bg-white dark:bg-[#27272a] border border-slate-200 dark:border-white/10 shadow-lg text-[11px] font-bold flex items-center gap-1">
            <ArrowUp size={13} /> Top
          </button>
        )}
        {playingBelow && (
          <button onClick={scrollToPlaying} className="h-8 px-3 rounded-full bg-red-500 text-white shadow-lg text-[11px] font-bold flex items-center gap-1">
            재생 중인 후원 <ChevronDown size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

const ICONS: Partial<Record<DonationKind, [typeof MessageSquareText, string]>> = {
  text: [MessageSquareText, 'bg-blue-500'],
  mini: [MessageSquareText, 'bg-sky-500'],
  signature: [Sparkles, 'bg-pink-500'],
  voice: [Mic, 'bg-emerald-500'],
  video: [PlayCircle, 'bg-indigo-600'],
  roulette: [PieChart, 'bg-amber-500'],
  wishlist: [Star, 'bg-violet-400'],
  vote: [Vote, 'bg-teal-500'],
  quest: [ShieldCheck, 'bg-purple-500'],
  drawing: [Brush, 'bg-rose-400'],
  gift: [Gift, 'bg-fuchsia-500'],
  luckybox: [Box, 'bg-blue-600'],
  play: [Gamepad2, 'bg-lime-600'],
  game: [Gamepad2, 'bg-orange-500'],
};

export function KindIcon({ kind }: { kind: DonationKind }) {
  const [Icon, bg] = ICONS[kind] ?? [Radio, 'bg-slate-500'];
  return (
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`} title={KIND_LABEL[kind]}>
      <Icon size={18} className="text-white" />
    </div>
  );
}

/** 카드형 행 (반응형 UI). 클릭하면 자세히 보기가 열리고, 다른 행을 열면 기존 행은 닫힌다 (p50 ①). */
function Card({ d, now, blocked, playing, open, onToggle }: { d: Donation; now: number; blocked: boolean; playing: boolean; open: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <li data-id={d.id} className={`${blocked ? 'bg-slate-100 dark:bg-white/[0.03] opacity-70' : playing ? 'playing-row bg-red-50 dark:bg-red-500/10' : ''}`}>
      <button onClick={onToggle} className="w-full flex gap-3 p-3 text-left">
        <KindIcon kind={d.kind} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2">
            <div className="min-w-0">
              <div className="font-black text-[13px] text-slate-900 dark:text-white truncate">{d.nickname}</div>
              <div className="text-[10px] text-slate-400 truncate">({d.account})</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-blue-600 dark:text-blue-400 font-black text-[13px]">{formatCash(d.cash)}</div>
              <div className="text-[10px] text-slate-400 flex items-center justify-end gap-0.5">{relativeTime(d.createdAt, now)} {open ? <ChevronUp size={11} /> : null}</div>
            </div>
          </div>
          <div className={`mt-1 text-[12px] text-slate-600 dark:text-gray-300 ${open ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'}`}>
            {d.kind === 'video' && <span className="text-red-500 font-bold mr-1">[{d.platform}]</span>}
            {d.kind === 'video' ? d.title : contentText(d)}
          </div>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pl-[60px] space-y-2">
          {d.kind === 'video' && d.thumbnail && (
            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
              <img src={d.thumbnail} alt="영상의 썸네일 이미지" className="w-full aspect-video object-cover" />
              <div className="p-2 text-[11px] font-bold">{d.title}</div>
              <button className="w-full h-8 bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1" onClick={() => d.url && openUrl(d.url)}>
                <ExternalLink size={12} /> 영상 보러 가기
              </button>
            </div>
          )}
          <Actions>{<RowButtons d={d} blocked={blocked} compact />}</Actions>
          {blocked && <p className="text-[10px] text-slate-400">{t('차단')}된 후원자입니다.</p>}
        </div>
      )}
    </li>
  );
}

const Actions = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap gap-1.5">{children}</div>;
