// 관리자 웹 공통 조각. 색·모서리·글자는 리모컨과 같은 디자인 토큰을 쓴다.
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createStore, useStore } from '../state/store';
import { Button, IconButton } from '../components/primitives';

export const num = (n: number) => n.toLocaleString('ko-KR');
export const pct = (part: number, total: number) => (total ? `${((part / total) * 100).toFixed(1)}%` : '0%');

/** 이메일 가리기: tiredcat@gmail.com → tir*****@gmail.com */
export function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  const keep = Math.min(3, Math.max(1, local.length - 2));
  return `${local.slice(0, keep)}${'*'.repeat(Math.max(2, local.length - keep))}@${domain}`;
}

/** 3분 전 · 5시간 전 · 12일 전 */
export function ago(t: number, now = Date.now()) {
  const s = Math.max(0, (now - t) / 1000);
  if (s < 60) return '방금';
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

/** 서버 요청 결과. 다시 불러오는 동안 이전 결과를 흐리게 유지한다 (화면이 튀지 않게) */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    load().then((v) => {
      if (!alive) return;
      setData(v);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, reload };
}

// ------------------------------------------------------------------ 토스트

const toastStore = createStore<{ items: { id: number; message: string; tone: 'info' | 'error' }[] }>({ items: [] });
let toastSeq = 1;
export function toast(message: string, tone: 'info' | 'error' = 'info') {
  const id = toastSeq++;
  toastStore.set((s) => ({ items: [...s.items, { id, message, tone }] }));
  setTimeout(() => toastStore.set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 2800);
}
export function Toasts() {
  const items = useStore(toastStore, (s) => s.items);
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-toast flex flex-col-reverse items-center gap-2 pointer-events-none">
      {items.map((t) => (
        <div key={t.id} role="status" className={`pop px-4 py-2.5 rounded-card border text-body font-medium shadow-float ${t.tone === 'error' ? 'bg-danger border-danger text-white' : 'bg-surface-raised border-line-strong text-text'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ 배치

export function PageHeader({ title, desc, right }: { title: string; desc?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-[1.25rem] leading-7 font-bold">{title}</h1>
        {desc && <p className="mt-0.5 text-body text-text-secondary">{desc}</p>}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function Card({ title, right, children, className = '', pad = true }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-widget bg-surface border border-line ${className}`}>
      {title && (
        <header className="flex items-center gap-2 px-4 h-12 border-b border-line">
          <h2 className="text-title-widget">{title}</h2>
          {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

/** 숫자 카드: 이름 · 값 · 보조 설명 */
export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-widget bg-surface border border-line px-4 py-3.5 min-w-0">
      <p className="text-caption text-text-secondary">{label}</p>
      <p className="mt-1 text-[1.5rem] leading-8 font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-caption text-text-tertiary truncate">{sub}</p>}
    </div>
  );
}

type Tone = 'neutral' | 'brand' | 'warning' | 'danger';
const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-text-secondary border-line',
  brand: 'bg-brand-tint text-brand-hover dark:text-link border-brand-tint-line',
  warning: 'bg-warning/15 text-warning-text border-warning/40',
  danger: 'bg-danger/[0.04] text-danger border-danger/40',
};
/** 상태 표시: 색 + 글자 (색만으로 구분하지 않는다) */
export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center h-5 px-1.5 rounded-tag border text-micro font-semibold whitespace-nowrap ${TONE[tone]}`}>{children}</span>;
}

export const thClass = 'h-9 px-3 text-left text-caption font-semibold text-text-secondary bg-surface-sunken border-b border-line whitespace-nowrap';
export const tdClass = 'h-11 px-3 border-b border-line-subtle whitespace-nowrap';

export function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.max(1, Math.min(page - 2, last - 4));
  const pages = Array.from({ length: Math.min(5, last) }, (_, i) => from + i);
  return (
    <nav className="flex items-center justify-center gap-1 py-3" aria-label="페이지">
      <IconButton label="이전 페이지" disabled={page <= 1} onClick={() => onChange(page - 1)} className="disabled:opacity-30">
        <ChevronLeft size={16} />
      </IconButton>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
          className={`min-w-7 h-7 px-1.5 rounded-control text-caption font-num tabular-nums ${p === page ? 'bg-brand text-text-on-brand font-semibold' : 'text-text-secondary hover:bg-surface-raised'}`}
        >
          {p}
        </button>
      ))}
      <IconButton label="다음 페이지" disabled={page >= last} onClick={() => onChange(page + 1)} className="disabled:opacity-30">
        <ChevronRight size={16} />
      </IconButton>
    </nav>
  );
}

// ------------------------------------------------------------------ 겹쳐 뜨는 창

/** Esc는 맨 위에 열린 창 하나만 닫는다 (회원 패널 위 정지 창 → 정지 창만) */
const escStack: (() => void)[] = [];
if (typeof window !== 'undefined') window.addEventListener('keydown', (e) => e.key === 'Escape' && escStack[escStack.length - 1]?.());
function useEscape(onClose: () => void) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    const h = () => ref.current();
    escStack.push(h);
    return () => {
      escStack.splice(escStack.indexOf(h), 1);
    };
  }, []);
}

/** 오른쪽에서 열리는 상세 패널 */
export function Drawer({ title, onClose, children, footer }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-sheet bg-scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal className="absolute right-0 top-0 h-full w-full max-w-[520px] flex flex-col bg-surface border-l border-line shadow-float">
        <header className="flex items-center gap-2 pl-5 pr-3 h-14 shrink-0 border-b border-line">
          <h2 className="text-[1rem] font-bold truncate">{title}</h2>
          <IconButton label="닫기" onClick={onClose} className="ml-auto">
            <X size={18} />
          </IconButton>
        </header>
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
        {footer && <footer className="shrink-0 px-5 py-3 flex justify-end gap-2 border-t border-line">{footer}</footer>}
      </aside>
    </div>
  );
}

export function Dialog({ title, onClose, children, footer, width = 'max-w-lg' }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: string }) {
  useEscape(onClose);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-scrim p-4" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal className={`pop w-full ${width} max-h-[90vh] flex flex-col rounded-card bg-surface border border-line shadow-float`}>
        <header className="flex items-center gap-2 pl-5 pr-3 h-12 shrink-0 border-b border-line">
          <h2 className="text-title-widget truncate">{title}</h2>
          <IconButton label="닫기" onClick={onClose} className="ml-auto">
            <X size={16} />
          </IconButton>
        </header>
        <div className="overflow-auto p-5">{children}</div>
        {footer && <footer className="shrink-0 px-5 py-3 flex justify-end gap-2 border-t border-line">{footer}</footer>}
      </div>
    </div>
  );
}

/** 확인 창. 되돌리기 어려운 동작은 danger + 동작 이름 버튼 (리모컨 Confirm과 같은 규칙) */
export function ConfirmDialog({ message, note, confirmLabel, danger, onConfirm, onCancel }: { message: ReactNode; note?: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  useEscape(onCancel);
  return (
    <div className="fixed inset-0 z-alert flex items-center justify-center bg-scrim p-4" onPointerDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="alertdialog" className="pop w-[380px] max-w-full rounded-card bg-surface border border-line shadow-float p-5">
        <p className="text-[0.9375rem] font-semibold whitespace-pre-line">{message}</p>
        {note && <div className="mt-1.5 text-body text-text-secondary whitespace-pre-line">{note}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>취소</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function FieldRow({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 py-2.5">
      <div className="text-body font-semibold sm:pt-1.5">
        {label}
        {required && <span className="text-danger ml-0.5" aria-label="필수">*</span>}
      </div>
      <div className="min-w-0">
        {children}
        {hint && <p className="mt-1 text-caption text-text-tertiary">{hint}</p>}
      </div>
    </div>
  );
}

export const textareaClass =
  'w-full px-2.5 py-2 rounded-control bg-surface-raised border border-line-strong text-body text-text placeholder:text-text-tertiary outline-none focus:border-live resize-y';
