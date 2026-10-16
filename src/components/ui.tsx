import { X } from 'lucide-react';
import { useCallback, type ReactNode } from 'react';
import { api } from '../state/app';
import { useData, useOutsideClick } from '../lib/hooks';
import { useT } from '../lib/i18n';

/** iOS 26 토글: 가로로 긴 알약형 손잡이, ON = Green (키트 64×28, 손잡이 39×24를 데스크톱 밀도로 축소) */
export function Toggle({ on, onChange, label, size = 'md', disabled }: { on: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md'; disabled?: boolean }) {
  const track = size === 'sm' ? 'w-[46px] h-[22px]' : 'w-[56px] h-[26px]';
  const knob = size === 'sm' ? 'w-[28px] h-[18px]' : 'w-[34px] h-[22px]';
  const shift = size === 'sm' ? 'translate-x-[14px]' : 'translate-x-[18px]';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative ${track} shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-green-500' : 'bg-[rgba(120,120,128,0.16)] dark:bg-[rgba(120,120,128,0.32)]'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-[2px] left-[2px] ${knob} rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.06)] transition-transform duration-200 ${on ? shift : ''}`} />
      <span className="sr-only">{on ? 'ON' : 'OFF'}</span>
    </button>
  );
}

/** 시트형 모달 (iPad Sheet: 모서리 38, 유리). X 버튼 또는 바깥 영역 클릭으로 닫힌다 (공통 정책). */
export function Modal({ title, onClose, children, width = 'max-w-md', footer }: { title?: ReactNode; onClose: () => void; children: ReactNode; width?: string; footer?: ReactNode }) {
  const close = useCallback(() => onClose(), [onClose]);
  const ref = useOutsideClick<HTMLDivElement>(close);
  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/25 p-4">
      <div ref={ref} role="dialog" aria-modal className={`pop w-full ${width} max-h-[90vh] flex flex-col rounded-sheet bg-white dark:bg-[#1c1c1e] text-black dark:text-white shadow-sheet overflow-hidden`}>
        {title !== undefined && (
          <div className="relative flex items-center justify-center px-4 h-14 shrink-0">
            <button aria-label="닫기" onClick={onClose} className="absolute left-3 w-9 h-9 rounded-full glass flex items-center justify-center text-black/70 dark:text-white/80">
              <X size={16} />
            </button>
            <h2 className="text-[15px] font-semibold">{title}</h2>
          </div>
        )}
        <div className="overflow-auto">{children}</div>
        {footer && <div className="shrink-0 px-5 py-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** iOS 알림창: 모서리 34, 유리, 제목 Semibold + 설명 + 세로로 쌓인 capsule 버튼 */
function AlertShell({ children, onBackdrop }: { children: ReactNode; onBackdrop?: () => void }) {
  return (
    <div className="fixed inset-0 z-[21000] flex items-center justify-center bg-black/20 p-4" onPointerDown={(e) => onBackdrop && e.target === e.currentTarget && onBackdrop()}>
      <div role="alertdialog" className="pop w-[300px] max-w-full rounded-alert glass-strong p-[14px] pt-5 text-left">{children}</div>
    </div>
  );
}

export function Confirm({ message, note, confirmLabel, onConfirm, onCancel }: { message: ReactNode; note?: ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  const t = useT();
  return (
    <AlertShell onBackdrop={onCancel}>
      <p className="px-2 text-[15px] font-semibold text-black dark:text-white whitespace-pre-line">{message}</p>
      {note && <p className="mt-1.5 px-2 text-[13px] text-black/80 dark:text-white/80 whitespace-pre-line">{note}</p>}
      <div className="mt-4 space-y-2">
        <Button size="lg" className="w-full" onClick={onConfirm}>{confirmLabel ?? t('확인')}</Button>
        <Button size="lg" variant="ghost" className="w-full" onClick={onCancel}>{t('취소')}</Button>
      </div>
    </AlertShell>
  );
}

export function Alert({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  const t = useT();
  return (
    <AlertShell>
      <p className="px-2 text-[15px] font-semibold text-black dark:text-white">{title}</p>
      <p className="mt-1.5 px-2 text-[13px] text-black/80 dark:text-white/80 whitespace-pre-line">{message}</p>
      <Button size="lg" className="mt-4 w-full" onClick={onClose}>{t('확인')}</Button>
    </AlertShell>
  );
}

/** capsule 버튼. primary = Blue 채움, ghost = Fills/Secondary, danger = Red, dark = 검정/흰색 반전 */
export function Button({ variant = 'primary', size = 'md', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'dark'; size?: 'md' | 'lg' }) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:brightness-110 active:brightness-95 disabled:bg-[rgba(120,120,128,0.16)] disabled:text-black/30 dark:disabled:text-white/30',
    ghost: 'bg-[rgba(120,120,128,0.16)] text-black hover:bg-[rgba(120,120,128,0.22)] dark:bg-[rgba(120,120,128,0.32)] dark:text-white dark:hover:bg-[rgba(120,120,128,0.4)]',
    danger: 'bg-red-500 text-white hover:brightness-110',
    dark: 'bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black',
  }[variant];
  const dim = size === 'lg' ? 'h-12 px-5 text-[15px]' : 'h-9 px-4 text-[13px]';
  return <button type="button" className={`${dim} rounded-full font-medium transition disabled:cursor-not-allowed ${styles} ${className}`} {...props} />;
}

export function Badge({ count, className = '' }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold leading-[18px] text-center tabular-nums ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="h-full min-h-[80px] flex items-center justify-center text-center text-xs text-slate-400 dark:text-gray-500 whitespace-pre-line p-4">{children}</div>;
}

export function Toasts() {
  const toasts = useData((d) => d.toasts);
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[30000] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} role="status" className={`pop pointer-events-auto max-w-sm px-5 py-3 rounded-[22px] text-[13px] font-medium whitespace-pre-line ${t.tone === 'error' ? 'bg-red-500 text-white shadow-glass' : 'glass text-black dark:text-white'}`} onClick={() => api.dismissToast(t.id)}>
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
      <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} whitespace-nowrap rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity z-50`}>
        {label}
      </span>
    </span>
  );
}

/** 위젯 안 공통 섹션 제목 */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[11px] font-bold text-slate-500 dark:text-gray-400">{children}</h3>
      {right}
    </div>
  );
}
