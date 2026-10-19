import { ArrowUp, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { contentText, relativeTime, sortDonations, tabOf } from '../../lib/donation';
import { useData, useNow, useSettings } from '../../lib/hooks';
import { useT } from '../../lib/i18n';
import { openUrl } from '../../platform';
import type { Donation } from '../../types';
import { Cash, Empty } from '../../components/ui';
import { KindDot, ResizableTh, RowButtons, ThumbPreview } from './parts';

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
          <ul>
            {list.map((d) => (
              <Card key={d.id} d={d} now={now} blocked={blocked.includes(d.donorId)} playing={playingIds.includes(d.id)} open={expanded === d.id} onToggle={() => setExpanded((v) => (v === d.id ? null : d.id))} />
            ))}
          </ul>
        ) : (
          <table className="w-full table-fixed border-collapse text-body">
            <thead className="sticky top-0 z-10 bg-surface-sunken">
              <tr>
                {/* 종류 칸은 최소 120px — "치지직 구독", "유튜브 슈퍼챗", "트위치 레이드"가 잘리지 않게 */}
                {tab === 'all' && <ResizableTh col="all.kind" width={128} min={120}>{t('후원')}</ResizableTh>}
                <ResizableTh col={`${tab}.nick`} width={200}>{t('닉네임(ID)')}</ResizableTh>
                <ResizableTh col={`${tab}.cash`} width={96} className="text-right">{tab === 'game' ? t('후원 금액(원)') : t('후원 캐시')}</ResizableTh>
                <ResizableTh col={`${tab}.content`}>{t('내용')}</ResizableTh>
                <th className="w-[7.5rem] h-8 px-[14px] text-caption text-text-secondary text-right whitespace-nowrap">{t('일시')}</th>
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
                    className={`group h-[46px] border-b border-line-subtle ${
                      isBlocked ? 'text-text-tertiary' : playing ? 'playing-row' : 'hover:bg-surface-sunken'
                    }`}
                  >
                    {tab === 'all' && (
                      <td className="pl-[14px] pr-2.5">
                        <KindDot kind={d.kind} className={`font-semibold ${isBlocked ? '' : 'text-text'}`} />
                      </td>
                    )}
                    <td className={`px-2.5 ${tab === 'all' ? '' : 'pl-[14px]'}`}>
                      {/* 닉네임과 아이디는 한 줄에 — 좁아지면 아이디부터 말줄임 */}
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className={`max-w-full truncate shrink-0 font-semibold ${isBlocked ? '' : 'text-text'}`}>{d.nickname}</span>
                        <span className="min-w-0 truncate text-micro text-text-tertiary">{d.account}</span>
                      </div>
                    </td>
                    <td className={`px-2.5 text-right ${isBlocked ? '' : 'text-text'}`}><Cash value={d.cash} /></td>
                    <td className={`px-2.5 ${isBlocked ? '' : 'text-text-body'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {d.thumbnail && (
                          <img src={d.thumbnail} alt="썸네일" onMouseEnter={(e) => onEnterContent(e, d, 'thumb')} className="w-10 h-6 rounded-tag object-cover shrink-0 cursor-pointer" />
                        )}
                        <span className="truncate" onMouseEnter={(e) => !d.thumbnail && onEnterContent(e, d, 'text')}>
                          {d.kind === 'video' && <span className="mr-1">[{d.platform}]</span>}
                          {d.kind === 'video' ? d.title : contentText(d)}
                        </span>
                      </div>
                    </td>
                    <td className="pl-1.5 pr-[14px] text-right">
                      <div className={`${isBlocked ? 'hidden' : 'group-hover:hidden'} text-caption text-text-tertiary`}>{relativeTime(d.createdAt, now)}</div>
                      <div className={`${isBlocked ? 'flex' : 'hidden group-hover:flex'} justify-end`}>
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
            <div className="max-w-[320px] rounded-control bg-surface-raised border border-line-strong text-text text-caption leading-relaxed px-3 py-2 shadow-float whitespace-pre-wrap select-text">{contentText(hover.d)}</div>
          )}
        </div>
      )}

      <div className="absolute right-3 bottom-3 flex flex-col items-end gap-2 z-20">
        {showTop && (
          <button onClick={() => scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })} className="h-[30px] px-3 rounded-control bg-surface-raised border border-line-strong text-text shadow-float text-caption font-semibold flex items-center gap-1">
            <ArrowUp size={13} /> Top
          </button>
        )}
        {playingBelow && (
          <button onClick={scrollToPlaying} className="h-[30px] px-3 rounded-control bg-brand text-text-on-brand shadow-float text-caption font-semibold flex items-center gap-1">
            재생 중인 후원 <ChevronDown size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/** 카드형 행 (반응형 UI). 클릭하면 자세히 보기가 열리고, 다른 행을 열면 기존 행은 닫힌다 (p50 ①). */
function Card({ d, now, blocked, playing, open, onToggle }: { d: Donation; now: number; blocked: boolean; playing: boolean; open: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <li data-id={d.id} className={`border-b border-line-subtle ${blocked ? 'text-text-tertiary opacity-70' : playing ? 'playing-row' : ''}`}>
      <button onClick={onToggle} className="w-full px-[14px] py-2.5 text-left hover:bg-surface-sunken">
        <div className="flex items-center justify-between gap-2">
          <KindDot kind={d.kind} className="text-caption text-text-secondary" />
          <span className="shrink-0 text-caption text-text-tertiary flex items-center gap-0.5">{relativeTime(d.createdAt, now)} {open ? <ChevronUp size={12} /> : null}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="max-w-full truncate shrink-0 font-semibold text-text">{d.nickname}</span>
            <span className="min-w-0 truncate text-micro text-text-tertiary">{d.account}</span>
          </div>
          <Cash value={d.cash} className="shrink-0 text-text" />
        </div>
        <div className={`mt-1 text-text-body ${open ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'}`}>
          {d.kind === 'video' && <span className="mr-1">[{d.platform}]</span>}
          {d.kind === 'video' ? d.title : contentText(d)}
        </div>
      </button>
      {open && (
        <div className="px-[14px] pb-3 space-y-2">
          {d.kind === 'video' && d.thumbnail && (
            <div className="rounded-card overflow-hidden border border-line">
              <img src={d.thumbnail} alt="영상의 썸네일 이미지" className="w-full aspect-video object-cover" />
              <div className="p-2 text-caption font-semibold text-text">{d.title}</div>
              <button className="w-full h-8 border-t border-line text-caption font-semibold text-link flex items-center justify-center gap-1 hover:bg-surface-raised" onClick={() => d.url && openUrl(d.url)}>
                <ExternalLink size={12} /> 영상 보러 가기
              </button>
            </div>
          )}
          <Actions>{<RowButtons d={d} blocked={blocked} compact />}</Actions>
          {blocked && <p className="text-micro text-text-tertiary">{t('차단')}된 후원자입니다.</p>}
        </div>
      )}
    </li>
  );
}

const Actions = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap gap-1.5">{children}</div>;
