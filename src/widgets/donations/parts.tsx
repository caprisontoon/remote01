import { ArrowDownWideNarrow, Ban, Check, ExternalLink, ListFilter, Play, PlusSquare, Undo2, X } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { api } from '../../state/app';
import { FILTER_KINDS, FILTER_LEFT, FILTER_RIGHT, KIND_LABEL, rowActions } from '../../lib/donation';
import { useSettings } from '../../lib/hooks';
import { useT } from '../../lib/i18n';
import { openUrl } from '../../platform';
import { kindColor } from '../../lib/kindColors';
import type { Donation, DonationKind, SortOrder } from '../../types';
import { Popover, Tooltip } from '../../components/ui';

/** 후원 종류: 8×8 사각 점(모서리 2px) + 이름 (토큰 문서 §1-5) */
export function KindDot({ kind, className = '' }: { kind: DonationKind; className?: string }) {
  return (
    <span className={`flex items-center gap-2 min-w-0 ${className}`}>
      <span className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: kindColor(kind) }} />
      <span className="truncate" title={KIND_LABEL[kind]}>{KIND_LABEL[kind]}</span>
    </span>
  );
}

/** 대기 중인 후원 등의 종류 태그: 같은 색 1px 테두리 + 글자 (바탕 없음) */
export function KindTag({ kind, label }: { kind: DonationKind; label?: string }) {
  const c = kindColor(kind);
  return (
    <span className="shrink-0 px-1.5 h-5 inline-flex items-center rounded-tag border text-micro font-bold" style={{ color: c, borderColor: c }}>
      {label ?? KIND_LABEL[kind]}
    </span>
  );
}

/**
 * 행 기능 버튼: 재생 / 차단(차단 해제) / 벽지 (p41 ④-1, p39 표).
 * 차단은 평소 외곽선(빨간 아이콘)이고, 버튼에 마우스를 올렸을 때만 빨간 바탕이 된다 — 목록을 훑을 때 시선을 뺏지 않게.
 */
export function RowButtons({ d, blocked, compact }: { d: Donation; blocked: boolean; compact?: boolean }) {
  const t = useT();
  const showBlock = useSettings((s) => s.showBlockButton);
  const acts = rowActions(d);
  const btn = 'inline-flex items-center justify-center gap-1 rounded-control text-micro font-bold transition-colors';
  const size = compact ? 'h-[30px] px-3' : 'w-7 h-7';
  const items: ReactNode[] = [];
  if (acts.replay) {
    items.push(
      <Tooltip key="r" label={t('재생')}>
        <button aria-label={t('재생')} className={`${btn} ${size} bg-brand text-text-on-brand hover:bg-brand-hover`} onClick={(e) => { e.stopPropagation(); api.replay(d.id); }}>
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
          className={`${btn} ${size} ${blocked ? 'bg-surface-raised border border-line-strong text-text hover:bg-surface-sunken' : 'bg-transparent border border-line-control text-danger hover:bg-danger hover:border-danger hover:text-white'}`}
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
        <button aria-label={t('벽지 등록')} className={`${btn} ${size} bg-surface-raised border border-line-strong text-text hover:bg-surface-sunken`} onClick={(e) => { e.stopPropagation(); api.registerWallpaper(d.id); }}>
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
    <div className="w-[240px] rounded-card overflow-hidden bg-surface border border-line shadow-float">
      <img src={d.thumbnail} alt="" className="w-full aspect-video object-cover bg-surface-raised" />
      <div className="p-2.5">
        <div className="text-micro font-bold text-text line-clamp-2">{d.kind === 'video' ? d.title : `${d.item} ${d.quantity ?? 1}개`}</div>
        {d.text && <div className="mt-1 text-micro text-text-secondary line-clamp-2">{d.text}</div>}
        {d.kind === 'video' && d.url && (
          <button className="mt-2 w-full h-7 rounded-control bg-surface-raised border border-line-strong text-text text-micro font-bold flex items-center justify-center gap-1" onClick={() => openUrl(d.url!)}>
            <ExternalLink size={12} /> 영상 보러 가기
          </button>
        )}
      </div>
    </div>
  );
}

/** 헤더 오른쪽 작은 외곽선 버튼 (필터·정렬) */
const headButton = (on: boolean) =>
  `h-[30px] px-2.5 rounded-control border flex items-center gap-1.5 text-caption font-medium whitespace-nowrap transition-colors ${on ? 'border-brand text-link bg-brand-tint' : 'border-line-control text-text-secondary hover:text-text hover:bg-surface-raised'}`;

/** 필터 모달 (p42 ①~③). 체크 즉시 적용, 닫기 또는 바깥 클릭 시 닫힘. */
export function FilterButton({ iconOnly }: { iconOnly?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const filters = useSettings((s) => s.filters);
  const close = useCallback(() => setOpen(false), []);
  const allOn = FILTER_KINDS.every((k) => filters.includes(k));
  const toggle = (k: DonationKind) => api.updateSettings({ filters: filters.includes(k) ? filters.filter((f) => f !== k) : [...filters, k] });
  const box = (k: DonationKind) => (
    <label key={k} className="flex items-center gap-2 py-1 text-body cursor-pointer">
      <input type="checkbox" className="accent-brand" checked={filters.includes(k)} onChange={() => toggle(k)} />
      {KIND_LABEL[k]}
    </label>
  );
  return (
    <>
      <button ref={setAnchor} aria-label={t('필터')} aria-expanded={open} onClick={() => setOpen((v) => !v)} className={headButton(!allOn)}>
        <ListFilter size={14} />
        {!iconOnly && t('필터')}
      </button>
      <Popover anchor={anchor} open={open} onClose={close} align="right" className="w-[320px]">
        <div className="flex items-center justify-between px-4 h-11 shrink-0 border-b border-line">
          <label className="flex items-center gap-2 text-body font-semibold cursor-pointer">
            <input type="checkbox" className="accent-brand" checked={allOn} onChange={() => api.updateSettings({ filters: allOn ? [] : FILTER_KINDS })} />
            {t('전체 선택')}
          </label>
          <button aria-label={t('닫기')} onClick={close} className="p-1 text-text-tertiary hover:text-text"><X size={15} /></button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 px-4 py-2 overflow-auto">
          <div>{FILTER_LEFT.map(box)}</div>
          <div>{FILTER_RIGHT.map(box)}</div>
        </div>
      </Popover>
    </>
  );
}

const SORTS: { id: SortOrder; label: string }[] = [
  { id: 'recent', label: '최근순' },
  { id: 'oldest', label: '나중순' },
  { id: 'high', label: '높은 금액순' },
  { id: 'low', label: '낮은 금액순' },
];

export function SortButton({ iconOnly }: { iconOnly?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const sort = useSettings((s) => s.sort);
  const close = useCallback(() => setOpen(false), []);
  const label = t(SORTS.find((s) => s.id === sort)!.label);
  return (
    <>
      <button ref={setAnchor} aria-label={t('정렬 옵션')} title={label} aria-expanded={open} onClick={() => setOpen((v) => !v)} className={headButton(false)}>
        <ArrowDownWideNarrow size={14} />
        {!iconOnly && label}
      </button>
      <Popover anchor={anchor} open={open} onClose={close} align="right" className="w-40 py-1">
        {SORTS.map((s) => (
          <button key={s.id} onClick={() => { api.updateSettings({ sort: s.id }); close(); }} className="w-full flex items-center justify-between px-3 h-8 text-body hover:bg-surface-sunken">
            {t(s.label)} {sort === s.id && <Check size={14} className="text-link" />}
          </button>
        ))}
      </Popover>
    </>
  );
}

/** 표 머리글 셀 넓이 조절 (v0.21 p38). 폭은 설정에 저장되어 다음 실행에도 유지된다. */
export function ResizableTh({ col, width, min: baseMin = 48, children, className = '' }: { col: string; width?: number; min?: number; children: ReactNode; className?: string }) {
  const widths = useSettings((s) => s.columnWidths);
  // 기본 폭·최소 폭은 100% 글자 크기 기준 — 텍스트 크기 125·150%에서는 같은 비율로 넓힌다
  const scale = useSettings((s) => s.textScale) / 100;
  const min = Math.round(baseMin * scale);
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    const th = (e.currentTarget as HTMLElement).parentElement!;
    const startX = e.clientX;
    const startW = th.getBoundingClientRect().width;
    const move = (ev: PointerEvent) => {
      th.style.width = `${Math.max(min, startW + ev.clientX - startX)}px`;
    };
    const up = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      api.updateSettings({ columnWidths: { ...widths, [col]: Math.max(min, Math.round(startW + ev.clientX - startX)) } });
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  const saved = widths[col] ?? (width !== undefined ? Math.round(width * scale) : undefined);
  const w = saved !== undefined ? Math.max(min, saved) : undefined;
  return (
    <th style={w ? { width: w, minWidth: min } : { minWidth: min }} className={`relative h-8 px-2.5 text-caption text-text-secondary text-left whitespace-nowrap overflow-hidden text-ellipsis ${className}`}>
      {children}
      <span role="separator" aria-label="셀 넓이 조절" onPointerDown={start} className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-live/40" />
    </th>
  );
}
