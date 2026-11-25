import { X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../state/app';
import { useData, useOutsideClick } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { formatCash } from '../lib/donation';
import { Button, IconButton } from './primitives';

export { Badge, Button, IconButton, Segmented, Toggle, fieldClass } from './primitives';

/** 모달: surface + radius-card + shadow-float + 1px line. X 버튼 또는 바깥 영역 클릭으로 닫힌다 (공통 정책). */
export function Modal({ title, onClose, children, width = 'max-w-md', footer }: { title?: ReactNode; onClose: () => void; children: ReactNode; width?: string; footer?: ReactNode }) {
  const close = useCallback(() => onClose(), [onClose]);
  const ref = useOutsideClick<HTMLDivElement>(close);
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-scrim p-4">
      <div ref={ref} role="dialog" aria-modal className={`pop w-full ${width} max-h-[90vh] flex flex-col rounded-card bg-surface border border-line text-text shadow-float overflow-hidden`}>
        {title !== undefined && (
          <div className="flex items-center gap-2 pl-4 pr-2 h-11 shrink-0 border-b border-line">
            <h2 className="text-title-widget truncate">{title}</h2>
            <IconButton label="닫기" onClick={onClose} className="ml-auto">
              <X size={16} />
            </IconButton>
          </div>
        )}
        <div className="overflow-auto">{children}</div>
        {footer && <div className="shrink-0 px-4 py-3 flex justify-end gap-2 border-t border-line">{footer}</div>}
      </div>
    </div>
  );
}

/** 확인·알림창: 모달과 같은 표면, 버튼은 오른쪽 아래 가로 배치 */
function AlertShell({ children, onBackdrop }: { children: ReactNode; onBackdrop?: () => void }) {
  return (
    <div className="fixed inset-0 z-alert flex items-center justify-center bg-scrim p-4" onPointerDown={(e) => onBackdrop && e.target === e.currentTarget && onBackdrop()}>
      <div role="alertdialog" className="pop w-[340px] max-w-full rounded-card bg-surface border border-line shadow-float p-5 text-left">{children}</div>
    </div>
  );
}

/**
 * 확인 창. 되돌릴 수 없는 동작(삭제·차단·종료·로그아웃 등)은 danger로 [확인] 자리를 위험 버튼으로 바꾸고,
 * confirmLabel에 동작 이름을 쓴다 (토큰 문서 §5, HANDOFF-01b).
 */
export function Confirm({ message, note, confirmLabel, danger, onConfirm, onCancel }: { message: ReactNode; note?: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const t = useT();
  return (
    <AlertShell onBackdrop={onCancel}>
      <p className="text-[0.9375rem] font-semibold text-text whitespace-pre-line">{message}</p>
      {note && <p className="mt-1.5 text-body text-text-secondary whitespace-pre-line">{note}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>{t('취소')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel ?? t('확인')}</Button>
      </div>
    </AlertShell>
  );
}

export function Alert({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  const t = useT();
  return (
    <AlertShell>
      <p className="text-[0.9375rem] font-semibold text-text">{title}</p>
      <p className="mt-1.5 text-body text-text-secondary whitespace-pre-line">{message}</p>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>{t('확인')}</Button>
      </div>
    </AlertShell>
  );
}

/** 5만 캐시 이상은 warning 색으로 강조 (토큰 문서 §2 amount) */
export const BIG_CASH = 50_000;

/** 금액: font-num 600, 5만 이상 warning */
export function Cash({ value, className = '' }: { value: number; className?: string }) {
  return <span className={`font-num font-semibold tabular-nums ${value >= BIG_CASH ? 'text-warning-text' : ''} ${className}`}>{formatCash(value)}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="h-full min-h-[80px] flex items-center justify-center text-center text-caption text-text-tertiary whitespace-pre-line p-4">{children}</div>;
}

export function Toasts() {
  const toasts = useData((d) => d.toasts);
  // 화면 아래 가운데, Dock 바로 위 (상단 바 아이콘을 가리지 않게)
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[84px] z-toast flex flex-col-reverse items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pop pointer-events-auto max-w-sm px-4 py-2.5 rounded-card border text-body font-medium whitespace-pre-line shadow-float ${t.tone === 'error' ? 'bg-danger border-danger text-white' : 'bg-surface-raised border-line-strong text-text'}`}
          onClick={() => api.dismissToast(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function Tooltip({ label, children, side = 'top' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="relative inline-flex group/tip">
      {children}
      <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} whitespace-nowrap rounded-control bg-surface-raised border border-line-strong px-2 py-1 text-caption text-text opacity-0 group-hover/tip:opacity-100 transition-opacity z-50`}>
        {label}
      </span>
    </span>
  );
}

/** 위젯 안 공통 섹션 제목 */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-caption font-bold text-text-secondary">{children}</h3>
      {right}
    </div>
  );
}

/**
 * 버튼 아래에 뜨는 팝오버. 문서 맨 위(body)에 그려서 위젯 틀에 잘리지 않고, Dock보다 위에 온다.
 * 바깥을 누르면 닫힌다 (anchor를 누른 경우는 anchor의 onClick이 처리).
 */
export function Popover({ anchor, open, onClose, align = 'left', className = '', children }: { anchor: HTMLElement | null; open: boolean; onClose: () => void; align?: 'left' | 'right'; className?: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      // 좁은 창에서도 화면 밖으로 나가지 않게 가장자리 8px 안쪽으로 제한한다
      setPos(align === 'left' ? { top: r.bottom + 6, left: Math.max(8, r.left) } : { top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor, align]);
  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open, anchor, onClose]);
  if (!open || !pos) return null;
  return createPortal(
    <div ref={panel} style={{ position: 'fixed', ...pos, maxHeight: `calc(100vh - ${pos.top + 8}px)`, maxWidth: 'calc(100vw - 16px)' }} className={`pop z-popover flex flex-col overflow-hidden rounded-card bg-surface border border-line shadow-float text-text ${className}`}>
      {children}
    </div>,
    document.body,
  );
}
