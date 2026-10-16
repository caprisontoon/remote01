import { ArrowDownWideNarrow, Ban, Check, ExternalLink, ListFilter, Play, PlusSquare, Undo2, X } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { api } from '../../state/app';
import { FILTER_KINDS, FILTER_LEFT, FILTER_RIGHT, KIND_LABEL, rowActions } from '../../lib/donation';
import { useOutsideClick, useSettings } from '../../lib/hooks';
import { useT } from '../../lib/i18n';
import { openUrl } from '../../platform';
import type { Donation, DonationKind, SortOrder } from '../../types';
import { Tooltip } from '../../components/ui';

/** 행 기능 버튼: 재생 / 차단(차단 해제) / 벽지 (p41 ④-1, p39 표). */
export function RowButtons({ d, blocked, compact }: { d: Donation; blocked: boolean; compact?: boolean }) {
  const t = useT();
  const showBlock = useSettings((s) => s.showBlockButton);
  const acts = rowActions(d);
  const btn = 'inline-flex items-center justify-center gap-1 rounded-md font-bold transition-colors';
  const size = compact ? 'h-8 px-3 text-[11px]' : 'w-7 h-7';
  const items: ReactNode[] = [];
  if (acts.replay) {
    items.push(
      <Tooltip key="r" label={t('재생')}>
        <button aria-label={t('재생')} className={`${btn} ${size} bg-blue-500 text-white hover:bg-blue-400`} onClick={(e) => { e.stopPropagation(); api.replay(d.id); }}>
          <Play size={13} />{compact && t('재생')}
        </button>
      </Tooltip>,
    );
  }
  if (acts.block && (showBlock || blocked)) {
    items.push(
      <Tooltip key="b" label={blocked ? t('차단 해제') : t('차단')}>
        <button
          aria-label={blocked ? t('차단 해제') : t('차단')}
          className={`${btn} ${size} ${blocked ? 'bg-slate-500 text-white hover:bg-slate-400' : 'bg-red-500 text-white hover:bg-red-400'}`}
          onClick={(e) => { e.stopPropagation(); if (blocked) api.unblock(d.donorId); else api.block(d.donorId); }}
        >
          {blocked ? <Undo2 size={13} /> : <Ban size={13} />}{compact && (blocked ? t('차단 해제') : t('차단'))}
        </button>
      </Tooltip>,
    );
  }
  if (acts.wallpaper) {
    items.push(
      <Tooltip key="w" label={t('벽지 등록')}>
        <button aria-label={t('벽지 등록')} className={`${btn} ${size} bg-slate-800 text-white hover:bg-slate-700 dark:bg-white/20`} onClick={(e) => { e.stopPropagation(); api.registerWallpaper(d.id); }}>
          <PlusSquare size={13} />{compact && t('벽지')}
        </button>
      </Tooltip>,
    );
  }
  return <div className="flex items-center gap-1">{items}</div>;
}

/** 썸네일 있는 후원의 마우스 오버 미리보기 (p41 ⑦). 영상은 '영상 보러 가기' 새 창 링크. */
export function ThumbPreview({ d }: { d: Donation }) {
  return (
    <div className="w-[240px] rounded-xl overflow-hidden bg-white dark:bg-[#1f1f22] border border-slate-200 dark:border-white/10 shadow-2xl">
      <img src={d.thumbnail} alt="" className="w-full aspect-video object-cover bg-slate-200" />
      <div className="p-2.5">
        <div className="text-[11px] font-bold text-slate-800 dark:text-gray-100 line-clamp-2">{d.kind === 'video' ? d.title : `${d.item} ${d.quantity ?? 1}개`}</div>
        {d.text && <div className="mt-1 text-[11px] text-slate-500 line-clamp-2">{d.text}</div>}
        {d.kind === 'video' && d.url && (
          <button className="mt-2 w-full h-7 rounded-md bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1" onClick={() => openUrl(d.url!)}>
            <ExternalLink size={12} /> 영상 보러 가기
          </button>
        )}
      </div>
    </div>
  );
}

/** 필터 모달 (p42 ①~③). 체크 즉시 적용, 닫기 또는 바깥 클릭 시 닫힘. */
export function FilterButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const filters = useSettings((s) => s.filters);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutsideClick<HTMLDivElement>(close, open);
  const allOn = FILTER_KINDS.every((k) => filters.includes(k));
  const toggle = (k: DonationKind) => api.updateSettings({ filters: filters.includes(k) ? filters.filter((f) => f !== k) : [...filters, k] });
  const active = !allOn;
  const box = (k: DonationKind) => (
    <label key={k} className="flex items-center gap-2 py-1 text-xs cursor-pointer">
      <input type="checkbox" className="accent-blue-600" checked={filters.includes(k)} onChange={() => toggle(k)} />
      {KIND_LABEL[k]}
    </label>
  );
  return (
    <div className="relative" ref={ref}>
      <Tooltip label={t('필터')} side="bottom">
        <button aria-label={t('필터')} onClick={() => setOpen((v) => !v)} className={`p-1.5 rounded-md ${active ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
          <ListFilter size={16} />
        </button>
      </Tooltip>
      {open && (
        <div className="pop absolute left-0 top-9 z-50 w-[320px] rounded-xl bg-white dark:bg-[#1f1f22] border border-slate-200 dark:border-white/10 shadow-2xl">
          <div className="flex items-center justify-between px-4 h-10 border-b border-slate-100 dark:border-white/10">
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input type="checkbox" className="accent-blue-600" checked={allOn} onChange={() => api.updateSettings({ filters: allOn ? [] : FILTER_KINDS })} />
              {t('전체 선택')}
            </label>
            <button aria-label={t('닫기')} onClick={close} className="p-1 text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 px-4 py-2 max-h-[320px] overflow-auto">
            <div>{FILTER_LEFT.map(box)}</div>
            <div>{FILTER_RIGHT.map(box)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const SORTS: { id: SortOrder; label: string }[] = [
  { id: 'recent', label: '최근순' },
  { id: 'oldest', label: '나중순' },
  { id: 'high', label: '높은 금액순' },
  { id: 'low', label: '낮은 금액순' },
];

export function SortButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const sort = useSettings((s) => s.sort);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutsideClick<HTMLDivElement>(close, open);
  return (
    <div className="relative" ref={ref}>
      <Tooltip label={t('정렬 옵션')} side="bottom">
        <button aria-label={t('정렬 옵션')} onClick={() => setOpen((v) => !v)} className="h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10">
          <ArrowDownWideNarrow size={15} />
          {t(SORTS.find((s) => s.id === sort)!.label)}
        </button>
      </Tooltip>
      {open && (
        <div className="pop absolute right-0 top-9 z-50 w-36 py-1 rounded-xl bg-white dark:bg-[#1f1f22] border border-slate-200 dark:border-white/10 shadow-2xl">
          {SORTS.map((s) => (
            <button key={s.id} onClick={() => { api.updateSettings({ sort: s.id }); close(); }} className="w-full flex items-center justify-between px-3 h-8 text-xs hover:bg-slate-50 dark:hover:bg-white/5">
              {t(s.label)} {sort === s.id && <Check size={13} className="text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 표 머리글 셀 넓이 조절 (v0.21 p38). 폭은 설정에 저장되어 다음 실행에도 유지된다. */
export function ResizableTh({ col, width, children, className = '' }: { col: string; width?: number; children: ReactNode; className?: string }) {
  const widths = useSettings((s) => s.columnWidths);
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    const th = (e.currentTarget as HTMLElement).parentElement!;
    const startX = e.clientX;
    const startW = th.getBoundingClientRect().width;
    const move = (ev: PointerEvent) => {
      th.style.width = `${Math.max(48, startW + ev.clientX - startX)}px`;
    };
    const up = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      api.updateSettings({ columnWidths: { ...widths, [col]: Math.max(48, Math.round(startW + ev.clientX - startX)) } });
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  const w = widths[col] ?? width;
  return (
    <th style={w ? { width: w } : undefined} className={`relative py-2 px-2.5 font-bold text-left border-r border-slate-100 dark:border-white/5 last:border-r-0 ${className}`}>
      {children}
      <span role="separator" aria-label="셀 넓이 조절" onPointerDown={start} className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/40" />
    </th>
  );
}
