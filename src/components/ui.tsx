import { X } from 'lucide-react';
import { useCallback, type ReactNode } from 'react';
import { api } from '../state/app';
import { useData, useOutsideClick } from '../lib/hooks';
import { useT } from '../lib/i18n';

export function Toggle({ on, onChange, label, size = 'md', disabled }: { on: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md'; disabled?: boolean }) {
  const w = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const knob = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative ${w} shrink-0 rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/15'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-0.5 left-0.5 ${knob} rounded-full bg-white shadow transition-transform ${on ? shift : ''}`} />
      <span className="sr-only">{on ? 'ON' : 'OFF'}</span>
    </button>
  );
}

/** 모달: X 버튼 또는 바깥 영역 클릭으로 닫힌다 (공통 정책). */
export function Modal({ title, onClose, children, width = 'max-w-md', footer }: { title?: ReactNode; onClose: () => void; children: ReactNode; width?: string; footer?: ReactNode }) {
  const close = useCallback(() => onClose(), [onClose]);
  const ref = useOutsideClick<HTMLDivElement>(close);
  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/40 p-4">
      <div ref={ref} role="dialog" aria-modal className={`pop w-full ${width} max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-gray-100 shadow-2xl border border-slate-200 dark:border-white/10`}>
        {title !== undefined && (
          <div className="flex items-center justify-between px-5 h-12 border-b border-slate-100 dark:border-white/10 shrink-0">
            <h2 className="text-sm font-bold">{title}</h2>
            <button aria-label="닫기" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="overflow-auto">{children}</div>
        {footer && <div className="shrink-0 px-5 py-3 border-t border-slate-100 dark:border-white/10 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ message, note, confirmLabel, onConfirm, onCancel }: { message: ReactNode; note?: ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-[21000] flex items-center justify-center bg-black/40 p-4" onPointerDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="alertdialog" className="pop w-full max-w-xs rounded-2xl bg-white dark:bg-[#1c1c1e] p-5 text-center shadow-2xl">
        <p className="text-sm font-semibold text-slate-800 dark:text-gray-100 whitespace-pre-line">{message}</p>
        {note && <p className="mt-2 text-xs text-slate-500 dark:text-gray-400 whitespace-pre-line">{note}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onCancel}>{t('취소')}</Button>
          <Button onClick={onConfirm}>{confirmLabel ?? t('확인')}</Button>
        </div>
      </div>
    </div>
  );
}

export function Alert({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-[21000] flex items-center justify-center bg-black/40 p-4">
      <div role="alertdialog" className="pop w-full max-w-xs rounded-2xl bg-white dark:bg-[#1c1c1e] p-5 text-center shadow-2xl">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-gray-400 whitespace-pre-line">{message}</p>
        <Button className="mt-5 w-full" onClick={onClose}>{t('확인')}</Button>
      </div>
    </div>
  );
}

export function Button({ variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'dark' }) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-white/10',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15',
    danger: 'bg-red-500 text-white hover:bg-red-400',
    dark: 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-black',
  }[variant];
  return <button type="button" className={`h-9 px-4 rounded-lg text-xs font-bold transition-colors disabled:cursor-not-allowed ${styles} ${className}`} {...props} />;
}

export function Badge({ count, className = '' }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center ${className}`}>
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
        <div key={t.id} role="status" className={`pop pointer-events-auto max-w-sm px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold whitespace-pre-line ${t.tone === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900/90 text-white'}`} onClick={() => api.dismissToast(t.id)}>
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
      <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover/tip:opacity-100 transition-opacity z-50`}>
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
